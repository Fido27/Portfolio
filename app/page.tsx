import Image from "next/image"

export default function Home() {
	return (
		<main>
			<p>
				parallax effect here
			</p>

			<div>
				<Image
					src = "/../public/pic.jpg"
					alt = "My photo ig"
					width={250}
					height={250}
				/>

				<p>
					Aarav Jain
				</p>
				<p>
					Software Developer
				</p>
				<p>
					
				</p>
			</div>
		</main>
	)
}
