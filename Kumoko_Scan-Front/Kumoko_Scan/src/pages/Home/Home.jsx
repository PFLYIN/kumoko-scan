import React from 'react';
import destaque from "../../assets/kumoko_logo.png";

function Home() {
  return (
    <div className="min-h-screen bg-[#0b0c10] text-zinc-200 font-sans">
      <section 
        className="relative h-[50vh] flex flex-col justify-center items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${destaque})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f111a]/80 via-transparent to-[#0b0c10]"></div>
        <div className="absolute inset-0 bg-[#0b0c10]/40 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 text-center px-4 max-w-3xl mt-20">
          <span className="text-indigo-300 font-light tracking-[0.4em] text-xs uppercase mb-6 block">
            Feito de fã para fã
          </span>
          <h1 className="text-4xl md:text-6xl font-light leading-snug mb-8 tracking-wide text-white/90">
            A magia de cada <br/>
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
              novo capítulo.
            </span>
          </h1>
          <button className="border border-indigo-300/30 bg-indigo-500/10 hover:bg-indigo-500/20 backdrop-blur-sm px-8 py-3 rounded-full text-xs font-medium tracking-widest text-indigo-100 transition-all duration-500">
            EXPLORAR OBRAS
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto py-24 px-6">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-[1px] w-8 bg-indigo-500/50"></div>
          <h2 className="text-lg font-light tracking-[0.2em] uppercase text-zinc-300">
            Atualizações Recentes
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="group cursor-pointer flex flex-col gap-3">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-lg shadow-black/20 ring-1 ring-white/5 transition-all duration-500 group-hover:-translate-y-2 group-hover:ring-indigo-500/30 group-hover:shadow-indigo-500/10">
                <img src={destaque} alt="Capa" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-medium tracking-wider text-indigo-300 border border-white/10">
                  Cap. 12
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">Título da Obra</h3>
                <p className="text-xs text-zinc-500">Há 2 horas</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;