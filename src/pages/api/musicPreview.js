import axios from 'axios';

const musicPreviewLinks = {
    "Up Beat": "https://drive.google.com/uc?export=download&id=1TXE74TAX6Ui3hakkEKYc_IRRJHoYFkV3",
    "Happy": "https://drive.google.com/uc?export=download&id=1XZJZ-rgcIdlI6KVA43q_K_JXiKr8XB03",
    "Jazz": "https://drive.google.com/uc?export=download&id=145TkAsa4l2IT8sm2ULCwZu5sXXvzC126",
    "Motivational": "https://drive.google.com/uc?export=download&id=13TBPm6axkQ1emcoRUgNDztZGAhbynMLN",
    "Rock": "https://drive.google.com/uc?export=download&id=18acx7Jg1E9KjnVACl8DZqjHzUK0cJTI3"
};

export default async (req, res) => {
    const genre = req.query.genre;
    
    if (!genre || !musicPreviewLinks[genre]) {
        return res.status(400).json({ error: 'Invalid genre provided' });
    }

    try {
        const { data } = await axios.get(musicPreviewLinks[genre], { responseType: 'stream' });
        data.pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch music preview' });
    }
};
