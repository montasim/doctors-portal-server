const express = require('express')
const cors = require('cors')
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ubat0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const availableAppointmentsCollection = client.db('doctors_portal').collection('availableAppointments');
        const bookedAppointmentsCollection = client.db('doctors_portal').collection('bookedAppointments');

        app.get('/availableAppointments', async (req, res) => {
            const query = {};
            const cursor = availableAppointmentsCollection.find(query);
            const availableAppointments = await cursor.toArray();

            res.send(availableAppointments);
        });

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            const availableAppointments = await availableAppointmentsCollection.find().toArray();
            const query = { date: date };
            const bookings = await bookedAppointmentsCollection.find(query).toArray();

            availableAppointments.forEach(appointment => {
                const appointmentBooking = bookings.filter(b => b.treatment === appointment.name);
                const bookedSlots = appointmentBooking.map(a => a.slot);
                const availableSlots = appointment.slots.filter(a => !bookedSlots.includes(a));
                appointment.available = availableSlots;
                // appointment.booked = appointmentBooking.map(a => a.slot);
            });

            res.send(availableAppointments);
        });

        app.post('/bookAppointment', async (req, res) => {
            const bookingData = req.body;
            const query = { treatment: bookingData.treatment, date: bookingData.date, patientName: bookingData.patientName };
            console.log(query);
            const existBooking = await bookedAppointmentsCollection.findOne(query);
            console.log(existBooking);
            if (existBooking) {
                return res.send({ success: false, bookedData: existBooking });
            }
            const result = bookedAppointmentsCollection.insertOne(bookingData);
            return res.send({ success: true, result });
        });
    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Doctors Portal')
})

app.listen(port, () => {
    console.log(`Doctors Portal app listening on port ${port}`)
})