// WorldCurrency

function countryBlock() {
    return (
        <div className="w-full h-36 text-center flex items-center justify-around">
            <span className="item-left">country, city</span>
            <span>time</span>
            <span className="text-right">temprature</span>
        </div>
    )
}

export default function page() {

	return (
		<main>
            <div>
                World Clock
            </div>
            {countryBlock()}
        </main>
    )

}