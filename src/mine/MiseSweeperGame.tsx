import React, {memo, useEffect, useRef, useState} from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import {DifficultySettings} from "./MineSweeper";
import {MineRender, MSGame} from "./GameEngine";
import {render} from "react-dom";

const RIGHT_CLICK_THRESHOLD_TIME_MS=1000;

function resetGame(difficulty:DifficultySettings,engineRef:any,setRendering:(v:Array<Array<MineRender>>)=>void ){
    const {rows,cols,flags}=difficulty;
    engineRef.current=new MSGame(rows,cols,flags);
    setRendering(engineRef.current.getRendering());
}

function MinePoint({flag,onClick,onRightAndLongClick}:{flag:MineRender,onClick:()=>void,onRightAndLongClick:()=>void}){
    const timeStampRef=useRef<number|null>(null);
    const isNumber=!isNaN(Number(flag))
    const content = isNumber ? flag:"";
    const divClass = isNumber ? "mine-number":`${flag}-card`;

    const onPointerLeave=()=>{timeStampRef.current=null}
    const onPointerDown=(evt:React.PointerEvent)=>{
        if(evt.button === 0){
            evt.preventDefault();
            timeStampRef.current=evt.timeStamp;
        }
    }
    const onPointerUp=(evt:React.PointerEvent)=>{
        if(evt.button === 0) {
            evt.preventDefault();
            if(timeStampRef.current!==null){
                const timeMs= evt.timeStamp-timeStampRef.current;
                if(timeMs > RIGHT_CLICK_THRESHOLD_TIME_MS){
                    onRightAndLongClick();
                }
                else{
                    onClick();
                }
            }
        }
    }
    const onRightClick=(evt:React.MouseEvent)=>{
        evt.preventDefault();
        onRightAndLongClick();
    }
    return <div className={`grid-card ${divClass}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave} onContextMenu={onRightClick}>{content}</div>
}
export const MineSweeperGame = memo(({difficulty, canPlaceFlags, decrementNumFlags, incrementNumFlags, onWin, onLoss}: { difficulty: DifficultySettings, canPlaceFlags: boolean, decrementNumFlags: () => void, incrementNumFlags: () => void, onWin: () => void, onLoss: () => void }) => {
    const engineRef=useRef(new MSGame(difficulty.rows,difficulty.cols,difficulty.flags));
    const [rendering, setRendering] = useState<Array<Array<MineRender>>>(engineRef.current.getRendering);
    useEffect(()=> resetGame(difficulty,engineRef,setRendering),[difficulty,engineRef,setRendering]);

    const engine=engineRef.current
    const {exploded,done}=engine.getStatus()
    let dataPoints;

    if(!done){
        const onClick=(rowIndex:number,colIndex:number,flag:MineRender)=>{
            //will not let you uncover a flagged square, like googles
            if(flag === "H"){
                engine.uncover(rowIndex,colIndex);
                setRendering(engine.getRendering());
            }
        }
        const onRightClick=(rowIndex:number,colIndex:number,flag:MineRender)=>{
            if(flag === "H" && canPlaceFlags){
                engine.mark(rowIndex,colIndex);
                setRendering(engine.getRendering())
                decrementNumFlags();
            }
            else if(flag === "F"){
                engine.mark(rowIndex,colIndex);
                setRendering(engine.getRendering())
                incrementNumFlags();
            }
        }
        dataPoints=rendering.map((row,rowIndex)=>row.map((flag,colIndex)=>{
            return <MinePoint key={`game_mine_${rowIndex}_${colIndex}`} flag={flag}
                              onClick={()=>onClick(rowIndex,colIndex,flag)} onRightAndLongClick={()=>onRightClick(rowIndex,colIndex,flag)}
            />
        }))
    }
    else{
        const onNextClick=exploded? onLoss:onWin;
        dataPoints=rendering.map((row,rowIndex)=>row.map((flag,colIndex)=>{
            return <MinePoint key={`game_mine_${rowIndex}_${colIndex}`} flag={flag} onClick={onNextClick} onRightAndLongClick={onNextClick}/>
        }))
    }

    return<div className="grid" style={{gridTemplateColumns: `repeat(${difficulty.cols}, 1fr)`} as any}>
            {dataPoints}
        </div>
})

