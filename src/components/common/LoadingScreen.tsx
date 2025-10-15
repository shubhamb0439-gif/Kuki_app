export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center">
        <img
          src="/logo kuki copy copy copy copy.png"
          alt="Kuki Logo"
          className="w-48 h-48 object-contain"
        />
      </div>

      <div className="relative w-full">
        <img
          src="/waves.png"
          alt=""
          className="w-full h-auto"
        />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white text-sm">© 2025 Kuki Company Ltd</p>
        </div>
      </div>
    </div>
  );
}
