import Image from "next/image"

export default function Home() {
	return (
		<main>
			<p>
				parallax effect here
			</p>

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
						<li>Github</li>
						<li>Instagram</li>
						<li>Discord</li>
						<li>Mail</li>
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
