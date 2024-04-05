import {Card, CardHeader, CardBody, CardFooter} from "@nextui-org/react"
import Image from "next/image"
import Link from "next/link"

function onMouseEnter(id:string) {
    var card = document.getElementById(id)
    var cardTitle = document.getElementById(id + "Title")
    var cardDesc = document.getElementById(id + "Desc")
    card?.classList.add("blur-sm")
    cardTitle?.classList.replace("inset-y-36" , "inset-y-6")
    cardDesc?.classList.replace("opacity-0" , "opacity-100")
    cardDesc?.classList.replace("inset-y-56" , "inset-y-16")
}

function onMouseLeave(id:string) {
    var card = document.getElementById(id)
    var cardTitle = document.getElementById(id + "Title")
    var cardDesc = document.getElementById(id + "Desc")
    card?.classList.remove("blur-sm")
    cardTitle?.classList.replace("inset-y-6" , "inset-y-36")
    cardDesc?.classList.replace("opacity-100" , "opacity-0")
    cardDesc?.classList.replace("inset-y-16" , "inset-y-56")
}

export function CardObj(id:string , src:string , title:string , desc:string) {
  
	return (
        <Card onMouseEnter = {(e) => {onMouseEnter(id)}} onMouseLeave={(e) => {onMouseLeave(id)}} className = "z-20 border-2 border-dashed w-[300px] h-[200px] m-10 rounded-2xl">
            <Link href="/blogs">
                <Image
                    className="object-cover relative w-[300px] h-[196px] rounded-2xl transition-all duration-300 delay-150"
                    id = {id}
                    src={src}
                    alt={title + " Image"}
                    height={0}
                    width={250}
                />
            </Link>

            <CardBody className="absolute">
                <div className="m-3 mx-4">
                    <div id={id + "Title"} className="absolute z-30 text-3xl inset-y-36 transition-all duration-500">
                        {title}
                    </div>
                    <div id={id + "Desc"} className="absolute z-30 opacity-0 inset-y-56 transition-all duration-500">
                        {desc}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
