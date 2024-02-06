import { Button } from "@nextui-org/react";

function handleInput(){

}

function handleSubmit(){
    
}

export default function Blogs() {
    return (
        <div className="items-center">
            <form  onSubmit={handleSubmit}>
                <input
                    className="bg-gray-200 w-full rounded-lg shadow border p-2"
                    placeholder="Ecrivez votre publication ici"
                    name="pub"
                    onChange={handleInput}
                />
                <div className="w-full flex flex-row flex-wrap mt-3">
                    <div className="w-2/3">
                        <Button 
                            type="submit"
                            className="float-right bg-indigo-400 hover:bg-indigo-300 text-white p-2 rounded-lg"
                            color="primary">
                            Play
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}