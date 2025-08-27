"use client";

import { Card, CardBody } from "@heroui/card";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "../utils/cn";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    id: string;
    src: string;
    title: string;
    desc: string;
    bloglink: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "30s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-2 w-max flex-nowrap",
          start && "animate-scroll ",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
				{items.map((item) => (
					<li
						className="group z-20 relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700"
						key={item.id}
					>
						<Card className = "w-[20vw] h-[20dvh] rounded-2xl">
							<Link href={item.bloglink}>
								<Image
									className={"object-cover relative w-full rounded-2xl transition-all duration-300 delay-150 group-hover:blur-sm"}
									src={item.src}
									alt={item.title + " Image"}
									height={0}
									width={1000}
								/>
						
							<CardBody className="absolute inset-0">
									<div className="absolute inset-0 z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-black/25 backdrop-brightness-75"></div>
									<div className="relative z-20 h-full w-full px-4 py-4 flex flex-col gap-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none">
										<div className="z-30 text-2xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
											{item.title}
										</div>
										<div className="z-30 text-md text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500 delay-100">
											{item.desc}
										</div>
									</div>
								</CardBody>
							</Link>
						</Card>
					</li>
				))}
			</ul>
		</div>
	);
};