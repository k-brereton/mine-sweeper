import React, {memo, useEffect, useRef, useState} from "react";
import {DifficultySettings} from "./MineSweeper";
import {MineRender, MSGame} from "./GameEngine";

const RIGHT_CLICK_THRESHOLD_TIME_MS = 1000;

function resetGame(difficulty: DifficultySettings, engineRef: any, setRendering: (v: Array<Array<MineRender>>) => void) {
    const {rows, cols, flags} = difficulty;
    engineRef.current = new MSGame(rows, cols, flags);
    setRendering(engineRef.current.getRendering());
}

function MinePoint({flag, onClick, onRightAndLongClick}: { flag: MineRender, onClick: () => void, onRightAndLongClick: () => void }) {
    const timeoutRef = useRef<number|null>(null);
    const isNumber = !isNaN(Number(flag))
    const divClass = isNumber ? "mine-number" : `${flag}-card`;

    useEffect(()=>{
        return ()=>{
            if(timeoutRef.current!==null){
                clearTimeout(timeoutRef.current);
                timeoutRef.current=null;
            }
        }
    })

    const onPointerLeave = () => {
        if(timeoutRef.current!==null){
            clearTimeout(timeoutRef.current);
            timeoutRef.current=null;
        }
    }
    const onPointerDown = (evt: React.PointerEvent) => {
        if (evt.button === 0) {
            evt.preventDefault();
            if(timeoutRef.current!==null){
                clearTimeout(timeoutRef.current);
                timeoutRef.current=null;
            }
            const timout:any=setTimeout(()=>{
                onRightAndLongClick();
                timeoutRef.current=null;
            },RIGHT_CLICK_THRESHOLD_TIME_MS);

            timeoutRef.current= timout;
        }
    }
    const onPointerUp = (evt: React.PointerEvent) => {
        if (evt.button === 0) {
            evt.stopPropagation();
            evt.preventDefault();
            if(timeoutRef.current!==null){
                clearTimeout(timeoutRef.current);
                onClick()
            }
        }
    }
    const onRightClick = (evt: React.MouseEvent) => {
        evt.preventDefault();
        if (evt.button === 2) {
            onRightAndLongClick();
        }
    }
    return <div className={`grid-card ${divClass}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave}
                onContextMenu={onRightClick}>{flag}</div>
}

export const MineSweeperGame = memo(({difficulty, decrementNumFlags, incrementNumFlags, onWin, onLoss}: { difficulty: DifficultySettings, decrementNumFlags: () => void, incrementNumFlags: () => void, onWin: () => void, onLoss: () => void }) => {
    const engineRef = useRef(new MSGame(difficulty.rows, difficulty.cols, difficulty.flags));
    const [rendering, setRendering] = useState<Array<Array<MineRender>>>(engineRef.current.getRendering);
    useEffect(() => resetGame(difficulty, engineRef, setRendering), [difficulty, engineRef, setRendering]);

    const engine = engineRef.current
    const {exploded, done} = engine.getStatus()
    let dataPoints;

    if (!done) {
        const onClick = (rowIndex: number, colIndex: number, flag: MineRender) => {
            //will not let you uncover a flagged square, like googles
            if (flag === "H") {
                engine.uncover(rowIndex, colIndex);
                setRendering(engine.getRendering());
            }
        }
        const onRightClick = (rowIndex: number, colIndex: number, flag: MineRender) => {
            if (flag === "H") {
                engine.mark(rowIndex, colIndex);
                setRendering(engine.getRendering())
                decrementNumFlags();
            } else if (flag === "F") {
                engine.mark(rowIndex, colIndex);
                setRendering(engine.getRendering())
                incrementNumFlags();
            }
        }
        dataPoints = rendering.map((row, rowIndex) => row.map((flag, colIndex) => {
            return <MinePoint key={`game_mine_${rowIndex}_${colIndex}`} flag={flag}
                              onClick={() => onClick(rowIndex, colIndex, flag)} onRightAndLongClick={() => onRightClick(rowIndex, colIndex, flag)}
            />
        }))
    } else {
        const onNextClick = exploded ? onLoss : onWin;
        dataPoints = rendering.map((row, rowIndex) => row.map((flag, colIndex) => {
            return <MinePoint key={`game_mine_${rowIndex}_${colIndex}`} flag={flag} onClick={onNextClick} onRightAndLongClick={onNextClick}/>
        }))
    }


    const {rows, cols} = difficulty
    return <div className="grid" style={{
        gridTemplateColumns: `repeat(${difficulty.cols}, ${100 / difficulty.cols}%)`,
        gridTemplateRows: `repeat(${difficulty.rows}, ${100 / difficulty.rows}%)`,
        height: `calc(${rows / cols}*min(800px,100vw, 100vh))`
    } as any}>
        {dataPoints}
    </div>
})

