import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

const defaultChallenges = [
  "Sheriff Kill", "Ace", "Clutch", "Knife Kill", "Operator Kill",
  "Wallbang Kill", "No Scope", "Collateral Kill", "Headshot Kill", "Defuse Last Second",
  "Plant Last Second", "One Tap", "Guardian Triple", "Classic Kill", "Flick Shot",
  "Spectre Spray Transfer", "Marshal Headshot", "Judge Double Kill", "Rez Teammate", "Smoke Kill",
  "Blind Kill", "Shorty Kill", "Stinger Spray", "Ultimate Kill", "Team Ace"
];

const defaultPlayerNames = ["Player 1","Player 2","Player 3","Player 4","Player 5"];
const playerColors = ["red","blue","green","yellow","purple"];

export default function App(){ 
  const [board,setBoard]=useState(defaultChallenges.slice(0,25));
  const [cellColors,setCellColors]=useState(Array(25).fill(null));
  const [playerNames,setPlayerNames]=useState(defaultPlayerNames);
  const [playerLocks,setPlayerLocks]=useState(Array(5).fill(null));
  const [activePlayer,setActivePlayer]=useState(null);
  const [status,setStatus]=useState('Disconnected');
  const [bet,setBet]=useState("noob");   // <-- új state

  const [showAdmin,setShowAdmin]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);
  const [loginUser,setLoginUser]=useState("");
  const [loginPass,setLoginPass]=useState("");

  const ref = doc(db,'games','shared');

  useEffect(()=>{
    let unsub;
    const init=async()=>{
      try{
        const snap=await getDoc(ref);
        if(!snap.exists()){
          await setDoc(ref,{ 
            board, 
            cellColors, 
            playerNames, 
            playerLocks, 
            bet: "noob",  // <-- alap bet
            createdAt: serverTimestamp() 
          });
        }
        unsub = onSnapshot(ref,(s)=>{
          if(!s.exists()) return;
          const d=s.data();
          setBoard(d.board || defaultChallenges.slice(0,25));
          setCellColors(d.cellColors || Array(25).fill(null));
          setPlayerNames(d.playerNames || defaultPlayerNames);
          setPlayerLocks(d.playerLocks || Array(5).fill(null));
          setBet(d.bet || "noob");  // <-- snapshotból
          setStatus('Connected');
        });
      }catch(e){
        console.error(e); 
        setStatus('Error');
      }
    };
    init();
    return ()=>{ if(unsub) unsub(); };
  },[]);

  const handleCellClick=async(i)=>{
    if (activePlayer === null) return;
    try{ 
      const newColors=[...cellColors]; 
      newColors[i]=activePlayer; 
      await updateDoc(ref,{cellColors:newColors}); 
    }catch(e){ 
      console.error(e); 
      setStatus('Error updating'); 
    }
  };

  const shuffleBoard=async()=>{
    try{ 
      const shuffled=[...board].sort(()=>Math.random()-0.5); 
      await updateDoc(ref,{board:shuffled, cellColors:Array(25).fill(null)}); 
    }catch(e){ 
      console.error(e); 
      setStatus('Error shuffling'); 
    } 
  };

  const resetGame=async()=>{
    try{ 
      await updateDoc(ref,{ 
        cellColors:Array(25).fill(null), 
        playerLocks:Array(5).fill(null) 
        // ⚠️ NEM reseteljük a neveket és a bet-et
      }); 
      setActivePlayer(null);
    }catch(e){ 
      console.error(e); 
      setStatus('Error resetting'); 
    } 
  };

  const updatePlayerName=async(i,name)=>{
    try{ 
      const newNames=[...playerNames]; 
      newNames[i]=name; 
      await updateDoc(ref,{playerNames:newNames}); 
    }catch(e){ 
      console.error(e); 
      setStatus('Error updating name'); 
    } 
  };

  const updateChallenge=async(i,val)=>{
    try{ 
      const newBoard=[...board]; 
      newBoard[i]=val; 
      await updateDoc(ref,{board:newBoard}); 
    }catch(e){ 
      console.error(e); 
      setStatus('Error updating challenge'); 
    } 
  };

  const updateBet=async(val)=>{
    try{
      setBet(val);
      await updateDoc(ref,{bet:val});
    }catch(e){
      console.error(e);
      setStatus("Error updating bet");
    }
  };

  const selectPlayer=async(i)=>{
    try{
      let myId = localStorage.getItem("playerId");
      if(!myId){
        myId = crypto.randomUUID();
        localStorage.setItem("playerId", myId);
      }

      if(playerLocks[i] !== null && playerLocks[i] !== myId){
        alert("Ez a hely már foglalt!");
        return;
      }

      const newLocks=[...playerLocks];
      newLocks[i]=myId;
      await updateDoc(ref,{playerLocks:newLocks});

      setActivePlayer(i);
    }catch(e){
      console.error(e);
      setStatus("Error selecting player");
    }
  };

  const handleLogin=()=>{
    if(loginUser==="csorvi" && loginPass==="276784"){
      setIsAdmin(true);
    } else {
      alert("Hibás adatok!");
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {/* rejtett gomb */}
      <button 
        onClick={()=>setShowAdmin(!showAdmin)} 
        className="absolute top-2 right-2 w-6 h-6 bg-transparent hover:bg-gray-200 rounded"
      >
        •
      </button>

      {showAdmin && (
        <div className="absolute top-10 right-2 bg-white shadow-lg border rounded p-4 w-64">
          {!isAdmin ? (
            <div className="space-y-2">
              <h2 className="font-bold">Admin Login</h2>
              <input 
                placeholder="Felhasználónév" 
                className="border p-1 w-full"
                value={loginUser} 
                onChange={e=>setLoginUser(e.target.value)}
              />
              <input 
                placeholder="Jelszó" 
                type="password"
                className="border p-1 w-full"
                value={loginPass} 
                onChange={e=>setLoginPass(e.target.value)}
              />
              <button onClick={handleLogin} className="bg-blue-600 text-white px-2 py-1 rounded w-full">
                Belépés
              </button>
            </div>
          ):( 
            <div className="space-y-2">
              <h2 className="font-bold">Challenge Editor</h2>
              {board.map((ch,i)=>(
                <input 
                  key={i} 
                  className="border p-1 rounded w-full"
                  value={ch} 
                  onChange={e=>updateChallenge(i,e.target.value)} 
                />
              ))}

              <h2 className="font-bold mt-4">Tét</h2>
              <input 
                className="border p-1 rounded w-full"
                value={bet}
                onChange={e=>updateBet(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      <h1 className="text-3xl font-bold text-center">Valorant Bingo — Shared</h1>
      <div className="flex justify-center gap-4">
        <button onClick={shuffleBoard} className="px-4 py-2 bg-blue-600 text-white rounded">Shuffle</button>
        <button onClick={resetGame} className="px-4 py-2 bg-red-600 text-white rounded">New Game</button>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {playerNames.map((name,i)=>(
          <div key={i} className="p-2 border rounded bg-white shadow flex flex-col">
            <div className="flex items-center gap-2">
              <div style={{width:18,height:18,backgroundColor:playerColors[i],borderRadius:9}}></div>
              <input className="border px-1 flex-1" value={name} onChange={e=>updatePlayerName(i,e.target.value)} />
            </div>
            <button 
              className={
                "mt-2 text-white py-1 rounded "+
                (activePlayer===i? "bg-gray-800":"bg-gray-500")
              } 
              onClick={()=>selectPlayer(i)}
              disabled={playerLocks[i] && playerLocks[i]!==localStorage.getItem("playerId")}
            >
              {playerLocks[i]
                ? (playerLocks[i]===localStorage.getItem("playerId") ? "Selected" : "Foglalt")
                : "Select"}
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto mt-6">
        {board.map((c,i)=>(
          <div 
            key={i} 
            onClick={()=>handleCellClick(i)} 
            className="p-4 text-center border rounded cursor-pointer select-none bg-white shadow"
            style={{ 
              backgroundColor: cellColors[i] !== null ? playerColors[cellColors[i]] : "white", 
              color: cellColors[i] !== null ? "white":"black" 
            }}>
            {c}
          </div>
        ))}
      </div>

      {/* Tét kiírása */}
      <div className="text-center text-lg font-semibold mt-4">
        Tét: {bet}
      </div>

      <div className="text-sm text-gray-600 text-center">{status}</div>
    </div>
  );
}
