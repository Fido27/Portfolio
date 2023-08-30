import Image from "next/image"
import Background from "./bg"


export default function Home() {

	return (
		<main>
			
			<Background/>

			<div className = "flex m-40 flex-wrap justify-evenly justify-items-center">
				<div className = "grid justify-items-center">
					<Image
						src = "/../public/pic.jpg"
						alt = "My photo ig"
						width = "200"
						height = "250"
					/>

					<p className = "pt-8 text-5xl font-bold">
						Aarav Jain
					</p>

					{/* <p className = "py-2 text-3xl font-thin">
						Software Developer
					</p> */}
					
					<ul className = "flex">
						<li>
							<Image
								src = "/../public/github.svg"
								alt = "Github Icon"
								width = "32"
								height = "32"
							/>
						</li>
						<li>
							<Image
								src = "/../public/linkedin.svg"
								alt = "LinkedIn Icon"
								width = "32"
								height = "32"
							/>
						</li>
						<li>
							<a href = "https://www.instagram.com/____fido/" target = "_blank">
							<Image
								src = "/../public/instagram.svg"
								alt = "Instagram Icon"
								width = "32"
								height = "32"
							/>
							</a>
						</li>
						<li>
							<Image
								src = "/../public/discord.svg"
								alt = "Discord Icon"
								width = "32"
								height = "32"
							/>
						</li>
						<li>
							<a href = "mailto:aaravjain272003@gmail.com" target = "_blank">
							<Image
								src = "/../public/email.svg"
								alt = "Email Icon"
								width = "32"
								height = "32"
							/>
							</a>
						</li>
					</ul>
				</div>

				<div>
					<p>
						A portfolio of my projects, and a project itself.
					</p>
				</div>
			</div>
		</main>
	)
}
