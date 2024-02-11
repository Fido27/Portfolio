import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/react"
import Image from "next/image"
import Link from "next/link"

function onMouseEnter(id:string) {
    var card = document.getElementById(id)
    card?.classList.add("blur-sm")
}

function onMouseLeave(id:string) {
    var card = document.getElementById(id)
    card?.classList.remove("blur-sm")
}

export function CardObj(id:string , src:string , title:string , desc:string) {
  
	return (
        <Link href="/blogs">
            <Card onMouseEnter = {(e) => {onMouseEnter(id)}} onMouseLeave={(e) => {onMouseLeave(id)}} className = "z-20 border-2 border-dashed w-[300px] h-[200px] m-10 rounded-2xl">
                <Image
                    className="object-cover relative w-[300px] h-[196px] rounded-2xl"
                    id = {id}
                    src={src}
                    alt={title + " Image"}
                    height={0}
                    width={250}
                />
                <CardBody className="absolute">
                    <div className="m-3 mx-4">
                        <div className="z-30 text-white/80 text-3xl transform transition-all rotate-45 duration-750 delay-150">
                            {title}
                        </div>
                        <div>
                            {desc}
                        </div>
                    </div>
                </CardBody>
            </Card>
        </Link>
    );
}
