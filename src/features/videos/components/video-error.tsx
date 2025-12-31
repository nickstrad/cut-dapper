type VideoErrorProps = {
  videoId: string;
};

export const VideoError = ({ videoId }: VideoErrorProps) => {
  return (
    <div className="container mx-auto py-8">
      <p className="text-destructive">Failed to load video {videoId}</p>
    </div>
  );
};
