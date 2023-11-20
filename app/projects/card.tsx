import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/react"
import Image from "next/image"

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
        <Card onMouseEnter = {(e) => {onMouseEnter(id)}} onMouseLeave={(e) => {onMouseLeave(id)}} id = {id} className = "z-20 border-2 border-dashed w-[300px] h-[200px] m-10 rounded-xl">
            <Image
                className="object-cover relative"
                src={src}
                alt={title + " Image"}
                height={0}
                width={250}
            />
            <CardBody className="m-2 bottom-1 absolute">
                <p className="z-30 text-white/80 text-2xl">
                    {title}
                </p>
                <p>
                    {desc}
                </p>
            </CardBody>
        </Card>
    );
}