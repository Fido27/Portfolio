import Image from "next/image"
import styles from './styles.module.css'
import Background from "./bg"

export default function Home() {

	return (
		<main>
			<div className={styles.bgImgDiv}>
				<Image
					className={styles.bgImg}
					src = "/Background/bg.jpg"
					alt = "BG image"
					fill
					style={{
						objectFit: 'cover',
					  }}
				/>
			</div>

			<div className = "absolute h-screen w-screen items-center justify-center flex">
				<div className="grid w-1/2 justify-items-center">
					<Image
						src = "/pic.jpg"
						alt = "My photo ig"
						width = "200"
						height = "250"
					/>

					<p className = "p-8 text-center text-6xl font-bold">
						Aarav Jain
					</p>

					{/* <p className = "py-2 text-3xl font-thin">
						Software Developer
					</p> */}
					
					<ul className = "flex">
						<li>
							<a href = "https://github.com/Fido27" target = "_blank">
							<Image
								src = "/github.svg"
								alt = "Github Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "https://www.linkedin.com/in/aaravjain272003/" target = "_blank">
							<Image
								src = "/linkedin.svg"
								alt = "LinkedIn Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "https://www.instagram.com/____fido/" target = "_blank">
							<Image
								src = "/instagram.svg"
								alt = "Instagram Icon"
								width = "30"
								height = "30"
								className="mx-1"
							/>
							</a>
						</li>
						<li>
							<a href = "mailto:aaravjain272003@gmail.com" target = "_blank">
							<Image
								src = "/email.svg"
								alt = "Email Icon"
								width = "32"
								height = "32"
								className="mx-1"
							/>
							</a>
						</li>
					</ul>
				</div>

				<div className="w-1/2 justify-items-center text-center">
					<p className="p-20 w-5/6 text-4xl">
						Welcome to my first published website. This is the portal to all my projects.{/* and dont forget to check out my blog.*/}
					</p>
				</div>
			</div>
		</main>
	)
}
