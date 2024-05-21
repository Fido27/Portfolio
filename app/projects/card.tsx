import Image from "next/image"
import Link from "next/link"
import { CardBody, CardContainer, CardItem } from "../ui/3d-card";

interface Card {
    title:string
    desc:string
    gitlink:string
    morelink:string
    imgsrc:string
}

export function projectCard(card:Card) {
	return (
        <CardContainer className="inter-var">
            <CardBody className="bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-1/2 h-auto rounded-xl p-5 border">
                <Image
                    className="object-cover absolute rounded-xl group-hover/card:shadow-xl"
                    src={card.imgsrc}
                    alt="thumbnail"
                    fill
                />
                <CardItem
                    translateZ={20}
                    className="text-xl font-bold text-neutral-600 dark:text-white"
                >
                    {card.title}
                </CardItem>
                <CardItem
                    as="p"
                    translateZ={60}
                    className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                >
                    {card.desc}
                </CardItem>
                <div className="flex justify-between items-center mt-2">
                    <CardItem
                        translateZ={20}
                        as={Link}
                        href={card.gitlink}
                        target="_self"
                        className="px-4 rounded-xl text-xs font-normal dark:text-white"
                    >
                        <Image
                            src = "/github.svg"
                            alt = "Github Icon"
                            width = "32"
                            height = "32"
                            className="mx-1"
                        />
                    </CardItem>
                    <CardItem
                        translateZ={20}
                        as={Link}
                        href={card.morelink}
                        target="_self"
                        className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                    >
                        <pre>More →</pre>
                    </CardItem>
                </div>
            </CardBody>
        </CardContainer>
    );
}