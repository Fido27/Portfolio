'use client'
import { MouseParallax } from "react-just-parallax";
import styles from './styles.module.css'
import Image from "next/image"

export default function Background() {
    return(
        <div className={styles.parallaxs}>
            <MouseParallax enableOnTouchDevice isAbsolutelyPositioned lerpEase={0.02} strength={1}>
                <Image
                    src = "/Background/1.jpg"
                    alt = "Sample Parallax image"
                    width = "4608"
                    height = "2592"
                />
            </MouseParallax>
        </div>
    )
}
