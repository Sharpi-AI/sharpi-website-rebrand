/**
 * Video Lazy Loading with Intersection Observer
 * Pauses videos when they're out of viewport to save resources
 * Recommended by Performance Report - Sprint 1
 */

export function setupVideoLazyLoading(): void {
  // Select all videos with autoplay attribute
  const videos = document.querySelectorAll<HTMLVideoElement>(
    "video[autoplay], video[data-video]"
  );

  if (videos.length === 0) {
    return;
  }

  // Create Intersection Observer
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;

        if (entry.isIntersecting) {
          // Video entered viewport - play it
          if (video.paused) {
            video
              .play()
              .catch((error) =>
                console.warn("Video play failed:", error.message)
              );
          }
        } else {
          // Video left viewport - pause it
          if (!video.paused) {
            video.pause();
          }
        }
      }
    },
    {
      rootMargin: "100px", // Start loading 100px before entering viewport
      threshold: 0.25, // Trigger when 25% of video is visible
    }
  );

  // Observe all videos
  for (const video of videos) {
    observer.observe(video);
  }

  console.log(`🎥 Video lazy loading enabled for ${videos.length} videos`);
}
