'use client'
import Image from "next/image"
import styles from './styles.module.css'
import Background from "./bg"
import Link from "next/link"
import { useState } from "react"

// Testing img mess up

let colorArr = ["rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)" , "rgb(50,160,15)"]

function randColor() {
	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	return `rgb(${r},${g},${b})`;
}

async function colorSeconds() {
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

	const seconds = document.getElementById("seconds")
	const seconde = document.getElementById("seconde")
	const secondc = document.getElementById("secondc")
	const secondo = document.getElementById("secondo")
	const secondn = document.getElementById("secondn")
	const secondd = document.getElementById("secondd")
	const time = document.getElementById("time")
	const projects = document.getElementById("projects")
	const blogs = document.getElementById("blogs")
	const resume = document.getElementById("resume")
	const about = document.getElementById("about")
	const contact = document.getElementById("contact")

	let magicColor
	while (1) {
		magicColor = randColor()
		seconds!.style.color = magicColor
		await sleep(1000)
		seconde!.style.color = magicColor
		await sleep(1000)
		secondc!.style.color = magicColor
		await sleep(1000)
		secondo!.style.color = magicColor
		await sleep(1000)
		secondn!.style.color = magicColor
		await sleep(1000)
		secondd!.style.color = magicColor
		await sleep(1000)
		time!.style.color = magicColor

		colorArr[Math.floor(Math.random() * colorArr.length)] = magicColor

		projects!.style.background = `linear-gradient(90deg, ${colorArr[0]}, ${colorArr[1]})`
		projects!.style.color = "transparent"
		projects!.style.backgroundClip = "text"

		blogs!.style.background = `linear-gradient(90deg, ${colorArr[2]}, ${colorArr[3]})`
		blogs!.style.color = "transparent"
		blogs!.style.backgroundClip = "text"

		resume!.style.background = `linear-gradient(90deg, ${colorArr[4]}, ${colorArr[5]})`
		resume!.style.color = "transparent"
		resume!.style.backgroundClip = "text"

		about!.style.background = `linear-gradient(90deg, ${colorArr[6]}, ${colorArr[7]})`
		about!.style.color = "transparent"
		about!.style.backgroundClip = "text"

		contact!.style.background = `linear-gradient(90deg, ${colorArr[8]}, ${colorArr[9]})`
		contact!.style.color = "transparent"
		contact!.style.backgroundClip = "text"

		await sleep(1000)
	}
}

export default function Home() {

	return (
		<main>
			<div className={styles.bgImgDiv}>
				<Image
					className={styles.bgImg}
					src = "/Background/magnetic black sand.jpg"
					alt = "BG image"
					fill
					style={{
						objectFit: 'cover',
					}}
				/>
			</div>

			<div className = "absolute h-screen w-screen items-center justify-center flex text-white">
				<div className="grid w-1/2 justify-items-center">
					<Image
						src = "/pic.jpg"
						alt = "My photo ig"
						width = "200"
						height = "250"
						onLoad={colorSeconds}
					/>

					<p className = "p-8 text-center text-6xl font-bold">
						Aarav Jain
					</p>

					{/* <p className = "py-3 text-3xl font-thin ">
						Software Developer
						</p> */}
					
					<ul className = "flex">
						<li>
							<a href = "https://github.com/Fido27" target = "_blank">
							<Image
								src = "/icons/github cartoon.svg"
								alt = "Github Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "mailto:aaravjain272003@gmail.com" target = "_blank">
							<Image
								src = "/icons/gmail cartoon.svg"
								alt = "Email Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "http://discordapp.com/users/361380275533512724" target = "_blank">
							<Image
								src = "/icons/discord cartoon.svg"
								alt = "Discord Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "https://www.instagram.com/____fido/" target = "_blank">
							<Image
								src = "/icons/instagram purple.svg"
								alt = "Instagram Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "https://www.linkedin.com/in/aaravjain272003/" target = "_blank">
							<Image
								src = "/icons/linkedin blue outline.svg"
								alt = "LinkedIn Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
					</ul>
				</div>

				<div className="w-1/2 justify-items-center text-center">
					<div className="p-6 w-5/6 text-2xl">

						The only trait I value&nbsp;
						<span id="seconds">s</span>
						<span id="seconde">e</span>
						<span id="secondc">c</span>
						<span id="secondo">o</span>
						<span id="secondn">n</span>
						<span id="secondd">d</span>
						&nbsp;to&nbsp;

						<span id="time">
							time
						</span>

						&nbsp;is asking the right questions.
						<br/><br/>

						<ul className="list-disc text-left">
							<li>{/* Projects */}
								Curious about my latest&nbsp;
								<Link href={"/projects"} id="projects" style={{
									background: `linear-gradient(90deg, ${colorArr[0]}, ${colorArr[1]})`,
									backgroundClip: 'text',
									color: 'transparent'
								}}>
									projects
								</Link>
								?
							</li>
							<li>{/* Blogs */}
								Looking to explore fresh insights and perspectives in my&nbsp;
								<Link href={"/blogs"} id="blogs" style={{
									background: `linear-gradient(90deg, ${colorArr[2]}, ${colorArr[3]})`,
									backgroundClip: 'text',
									color: 'transparent'
								}}>
									blogs
								</Link>
								?
							</li>
							<li>{/* Resume */}
								Just here to check out my&nbsp;
								<Link href={"/resume.pdf"} id="resume" style={{
									background: `linear-gradient(90deg, ${colorArr[4]}, ${colorArr[5]})`,
									backgroundClip: 'text',
									color: 'transparent'
								}}>
									resume
								</Link>
								?
							</li>
							<li>{/* About me */}
								Want to know more&nbsp;
								<Link href={"/about"} id="about" style={{
									background: `linear-gradient(90deg, ${colorArr[6]}, ${colorArr[7]})`,
									backgroundClip: 'text',
									color: 'transparent'
								}}>
									about me
								</Link>
								?
							</li>
							<li>{/* Contact me */}
								Want to sign a deal?&nbsp;
								<Link href={"/contact"} id="contact" style={{
									background: `linear-gradient(90deg, ${colorArr[8]}, ${colorArr[9]})`,
									backgroundClip: 'text',
									color: 'transparent'
								}}>
									Contact me
								</Link>
							</li>
						</ul>



						{/* Welcome to my Portfolio! <br/> My
						<Link href={"/projects"}><span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">
							&nbsp;projects&nbsp;
						</span></Link>
						are the offspring of my curiosity and courage to reimagine living. Dive into my
						<Link href={"/blogs"}><span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">
							&nbsp;blogs&nbsp;
						</span></Link>
						to uncover the secrets of life that I've discovered along the way. Want to know more 
						<Link href={"/about"}><span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">
							&nbsp;about me?
						</span></Link>
						<Link href={"/contact"}><span className="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-red-600">
							&nbsp;Reach out
						</span></Link>
						, and let's talk business or explore ways to bend reality through creativity and engineering. */}
					</div>
				</div>
			</div>
		</main>
	)
}