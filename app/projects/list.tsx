interface Card {
    title:string
    desc:string
    gitlink:string
    morelink:string
    imgsrc:string
} // links should be relative to 0.0.0.0/

export const projectsList:Card[]=[
    {   // 0
        title: "Longing",
        desc: "Social media for Long-Distance Relationship ideas", 
        gitlink: "/Background/bean.jpg" ,  
        morelink:"This is the description", 
        imgsrc:"/Background/bg.jpg"
    },
	{	// 1
		title: "Title",
        desc: "placeholder", 
        gitlink: "/Background/bean.jpg" ,  
        morelink:"This is the description", 
        imgsrc:""
	}
]