import mongoose from 'mongoose'
import dns from 'dns'

// Fix DNS resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4'])

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
        })

        console.log('DB connected successfully')

    } catch (error) {
        console.log('DB connection error:', error.message)
        console.log('Error code:', error.code)
        // Retry after 3 seconds
        setTimeout(() => {
            connectDB()
        }, 3000)
    }
}

export default connectDB
