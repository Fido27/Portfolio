'use client'
import { MouseParallax } from "react-just-parallax";
import Image from "next/image"

export default function Background() {
    return(
        <>
            <MouseParallax enableOnTouchDevice isAbsolutelyPositioned>
                <Image
                    src = "/../public/Sample Parallax/1.png"
                    alt = "Sample Parallax image"
                    width = "2049"
                    height = "1152"
                />
            </MouseParallax>
            <MouseParallax enableOnTouchDevice isAbsolutelyPositioned lerpEase={0.02}>
                <Image
                    src = "/../public/Sample Parallax/2.png"
                    alt = "Sample Parallax image"
                    width = "2049"
                    height = "1152"
                />
            </MouseParallax>
        </>
    )
}