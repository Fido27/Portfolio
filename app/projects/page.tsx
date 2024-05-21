'use client'
import { MouseParallax } from "react-just-parallax";
import Image from "next/image"
import styles from '../styles.module.css'
import { projectCard } from "./card";
import { projectsList } from "./list";

export default function Projects() {
	return (
        <main>
            <Image
                className={styles.bgImg}
                src = "/Background/bg.jpg"
                alt = {"BG Image"}
                fill
                style={{
                    objectFit: 'cover',
                }}
            />
            {/* <MouseParallax enableOnTouchDevice isAbsolutelyPositioned lerpEase={0.02} strength={0.3}>
                {CardObj(cardsList[0].id , cardsList[0].src , cardsList[0].title , cardsList[0].desc)}
            </MouseParallax> */}

            {projectCard(projectsList[0])}
        </main>
    )
}