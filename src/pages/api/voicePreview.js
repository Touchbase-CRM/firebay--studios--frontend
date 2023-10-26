import axios from 'axios';

const voicePreviewLinks = {
  Bryan: 'https://drive.google.com/uc?export=download&id=1XHZMuGSR6fmFxbEi6gAzIaMcZMpn8_eV',
  Charley: 'https://drive.google.com/uc?export=download&id=1wngVcIpz3CUYTVcOSSVKaGjSafmOMETI',
  Elizabeth: 'https://drive.google.com/uc?export=download&id=1OLfmzNm1EwaKYLhB1mkM1JUBQLcncsbN',
  Joe: 'https://drive.google.com/uc?export=download&id=1CwD3YjYRyRUGQSfIvHo8OR2TniyR8Lgg',
  Kate: 'https://drive.google.com/uc?export=download&id=17deqBO-9X_jJ_YQnCNi4vT7RYbPNFfGh'
};

export default async (req, res) => {
    const voiceName = req.body.voiceName
    if (!voiceName || !voicePreviewLinks[voiceName]) {
        return res.status(400).json({ error: 'Invalid voiceName provided' });
    }

    try {
        const { data } = await axios.get(voicePreviewLinks[voiceName], { responseType: 'stream' });
        data.pipe(res);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch voice preview: ${error.message}` });
    }
};
