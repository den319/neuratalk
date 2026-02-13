import "dotenv/config"
import UserModel from "../models/user.model"
import connectDatabase from "../config/database.config"

export const CreateNeuratalkAI= async() => {
    const existedAI= await UserModel.findOne({isAI: true})

    if(existedAI) {
        console.log("Neuratalk AI is already exist!\n")
        console.log("Deleting existing Neuratalk AI...\n")

        await UserModel.deleteOne({_id: existedAI._id})

        console.log("Deleted Neuratalk AI successfully!\n")
    }

    console.log("Creating Neuratalk AI...\n")

    const AI= await UserModel.create({
        name: "Neuratalk AI",
        isAI: true,
        avatar: "https://res.cloudinary.com/dpsculmjy/image/upload/v1770970920/AI_hp9v2i.jpg"
    })

    console.log("Neuratalk AI created successfully!")
    return AI
}

const seedNeuratalkAI= async() => {
    try {
        console.log("Seeding is started....")
        await connectDatabase()
        await CreateNeuratalkAI()

        console.log("Seeding completed.")
        process.exit(0)
    } catch(error) {
        console.error("Seeding failed: ", error)
        process.exit(1)
    }
}

seedNeuratalkAI()