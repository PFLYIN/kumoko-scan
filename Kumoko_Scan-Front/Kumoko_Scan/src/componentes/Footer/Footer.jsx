import React from 'react';

function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-white/5 py-16 text-center">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-black tracking-tighter mb-4">KUMOKO<span className="text-purple-600">SCAN</span></h2>
        <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto">
          Tradução e edição de mangás feita de fã para fã. Junte-se à nossa comunidade no Discord.
        </p>
        <div className="mt-8 pt-8 border-t border-white/5 text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
          © 2026 Kumoko Scan - Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}

export default Footer;