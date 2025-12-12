import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function AnimatedTestimonialsDemo() {
  const testimonials = [
    {
      quote:
        "Capture ideas instantly through text or voice-to-text inputs, then let AI refine them into clean summaries. Build interactive, editable mind maps with customizable nodes and edges .",
      name: "Performer Tools",
      designation: "",
      src: "https://media.istockphoto.com/id/2185399669/photo/rock-band-delivers-a-captivating-concert-with-lead-singer-passionately-performing-on-stage.webp?a=1&b=1&s=612x612&w=0&k=20&c=vANOWCPrkqNg-OB6CW47SyOTJyBwbCRQFz_RGjAVEhc=",
    },
    {
      quote:
        "Craft compelling stories with advanced writing features, collaboration tools, and intelligent content organization .",
      name: "Writer Tools",
      designation: "",
      src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d3JpdGVyfGVufDB8fDB8fHww",
    },
    {
      quote:
        "Visualize scene as moving dot simulations. Attach and version code snippets for each scene. Sync commits or locally deployed changes collaboratively .",
      name: "Developer Tools",
      designation: "",
      src: "https://plus.unsplash.com/premium_photo-1685086785636-2a1a0e5b591f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZGV2ZWxvcGVyfGVufDB8fDB8fHww",
    },
    {
      quote:
        "Connect your team with unified communication channels. Live Discussion via voice calls. Shared canvas, drawing, and scene optimization .",
      name: "Collaboration Hub",
      designation: "",
      src: "https://plus.unsplash.com/premium_photo-1661771825670-1720428a80ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29sbGFib3JhdGl2ZSUyMHdvcmtzcGFjZXxlbnwwfHwwfHx8MA%3D%3D",
    },
  ];
  return <AnimatedTestimonials testimonials={testimonials} />;
}
