import React, { useEffect, useState } from 'react';
const [currentPlayer, setCurrentPlayer] = useState(null);
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
  const [activePlayer,setActivePlayer]=useState(0);
  const [status,setStatus]=useState('Disconnected');
  const ref = doc(db,'games','shared');
  useEffect(()=>{
    let unsub;
    const init=async()=>{
      try{
        const snap=await getDoc(ref);
        if(!snap.exists()){
          await setDoc(ref,{ board, cellColors, playerNames, activePlayer, createdAt: serverTimestamp() });
        }
        unsub = onSnapshot(ref,(s)=>{
          if(!s.exists()) return;
          const d=s.data();
          setBoard(d.board || defaultChallenges.slice(0,25));
          setCellColors(d.cellColors || Array(25).fill(null));
          setPlayerNames(d.playerNames || defaultPlayerNames);
          setActivePlayer(typeof d.activePlayer==='number'?d.activePlayer:0);
          setStatus('Connected');
        });
      }catch(e){
        console.error(e); setStatus('Error');
      }
    };
    init();
    return ()=>{ if(unsub) unsub(); };
  },[]);
  const handleCellClick=async(i)=>{
    try{ const newColors=[...cellColors]; newColors[i]=activePlayer; await updateDoc(ref,{cellColors:newColors}); }catch(e){ console.error(e); setStatus('Error updating'); }
  };
  const shuffleBoard=async()=>{ try{ const shuffled=[...board].sort(()=>Math.random()-0.5); await updateDoc(ref,{board:shuffled, cellColors:Array(25).fill(null)}); }catch(e){ console.error(e); setStatus('Error shuffling'); } };
  const resetGame=async()=>{ try{ await updateDoc(ref,{cellColors:Array(25).fill(null), activePlayer:0, playerNames:defaultPlayerNames}); }catch(e){ console.error(e); setStatus('Error resetting'); } };
  const updatePlayerName=async(i,name)=>{ try{ const newNames=[...playerNames]; newNames[i]=name; await updateDoc(ref,{playerNames:newNames}); }catch(e){ console.error(e); setStatus('Error updating name'); } };
  const updateChallenge=async(i,val)=>{ try{ const newBoard=[...board]; newBoard[i]=val; await updateDoc(ref,{board:newBoard}); }catch(e){ console.error(e); setStatus('Error updating challenge'); } };
  const selectPlayer = async (i) => {
  try {
    setActivePlayer(i);
    await updateDoc(ref, { activePlayer: i });
  } catch (e) {
    console.error(e);
    setStatus('Error selecting player');
  }
};

  return (
    <div className="p-6 space-y-6">
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
            <button className={"mt-2 text-white py-1 rounded "+(activePlayer===i? "bg-gray-800":"bg-gray-500")} onClick={()=>selectPlayer(i)}>Select</button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto mt-6">
        {board.map((c,i)=>(
          <div key={i} onClick={()=>handleCellClick(i)} className="p-4 text-center border rounded cursor-pointer select-none bg-white shadow"
            style={{ backgroundColor: cellColors[i] !== null ? playerColors[cellColors[i]] : "white", color: cellColors[i] !== null ? "white":"black" }}>
            {c}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 mt-6 max-w-3xl mx-auto">
        {board.map((ch,i)=>(
          <input key={i} className="border p-1 rounded" value={ch} onChange={e=>updateChallenge(i,e.target.value)} />
        ))}
      </div>
      <div className="text-sm text-gray-600 text-center">{status}</div>
    </div>
  );
}
