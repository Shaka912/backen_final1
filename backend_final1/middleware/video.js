const MAX_DURATION_SECONDS = 35;

async function getVideoDuration(videoPath) {
  const info = await mediainfo.get(videoPath);
  return info.media.track[0].Duration / 1000;
}

const isValid = async (req, res, next) => {
  try {
    const video = req.file;
    console.log(`Received video: ${video.originalname}`);
    const videoDuration = await getVideoDuration(video.path);
    if (videoDuration > MAX_DURATION_SECONDS) {
      return res
        .status(400)
        .send({
          error: `Video duration must be less than ${MAX_DURATION_SECONDS} seconds`,
        });
    }
    next();
  } catch (error) {
    next();
    // res.status(401).send({ error: "error in processing video" });
  }
};

module.exports = isValid;
