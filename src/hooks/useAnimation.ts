export function useAnimation() {
  const getAnimationLabel = (emotion: string) => {
    switch (emotion) {
      case "happy":
        return "(^_^)";
      case "sad":
        return "(；_；)";
      case "angry":
        return "(╯°□°）╯";
      case "shy":
        return "(˶ᵔ ᵕ ᵔ˶)";
      case "thinking":
        return "( -_-)";
      default:
        return "(•‿•)";
    }
  };

  return { getAnimationLabel };
}
