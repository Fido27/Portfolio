import Image from "next/image";

export default function page() {
    const headingClasses = "text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100";

    return (
        <div className="flex h-screen items-center  mx-8">
            <div className="basis-1/2 text-center">
                <span className={headingClasses}>Wi-Fi</span>
                <Image src="/GuestAccess/WiFi QR Code.png" alt="Wi-Fi" width={1024} height={1024} />
            </div>

            <div className="h-full flex flex-col items-center justify-center mx-8">
                <div className="bg-gradient-to-b from-transparent via-neutral-300 dark:via-neutral-700 to-transparent w-[1px] h-4/5" />
            </div>

            <div className="basis-1/2 text-center">
                <span className={headingClasses}>Music Control</span>
                <Image src="/GuestAccess/Mass QR Code.png" alt="mass.local" width={1024} height={1024} />
            </div>
        </div>
    )
}