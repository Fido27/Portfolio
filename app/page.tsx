import Image from "next/image"

export default function Home() {
	return (
		<main>
			<p>
				parallax effect here
				//priority={false}
			</p>

			<div>
				<Image
					src = "/../public/pic.jpg"
					alt = "My photo ig"
					width = "720"
					height = "900"
				/>
				<p>
					Aarav Jain
				</p>
				<p>
					Software Developer
				</p>
				<p>
					A portfolio of my projects, and a project itself.
				</p>
			</div>
		</main>
	)
}
