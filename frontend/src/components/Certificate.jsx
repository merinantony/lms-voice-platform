import React from 'react';

export default function Certificate({ studentName, studentGrade, courseTitle, onClose }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      {/* Certificate Frame */}
      <div className="relative bg-[#fcfbf7] border-[16px] border-double border-amber-600 rounded-lg p-10 max-w-3xl w-full text-center shadow-2xl overflow-hidden print:shadow-none print:border-[12px] print:m-0 print:w-full">
        {/* Certificate Watermark / Background Graphics */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Close Button (Hidden when printing) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl font-bold transition print:hidden"
          title="Close Certificate"
        >
          ✕
        </button>

        {/* Certificate Header */}
        <div className="mb-4">
          <span className="text-amber-600 font-extrabold uppercase tracking-widest text-xs border-b border-amber-600 pb-1">
            Certificate of Accomplishment
          </span>
        </div>

        <h1 className="text-4xl font-serif text-slate-800 font-semibold mb-2 mt-4 print:text-3xl">
          Certificate of Completion
        </h1>
        <p className="text-slate-500 font-serif italic text-sm mb-8 print:mb-6">
          This is proudly presented to
        </p>

        {/* Recipient Name */}
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-slate-900 border-b-2 border-dashed border-amber-600 inline-block px-12 py-1 font-serif print:text-3xl">
            {studentName}
          </h2>
          <p className="text-amber-700 font-semibold mt-2 text-sm uppercase tracking-wide">
            {studentGrade}
          </p>
        </div>

        {/* Statement */}
        <div className="max-w-xl mx-auto mb-8 print:mb-6">
          <p className="text-slate-600 leading-relaxed text-sm">
            for successfully completing all required modules, learning materials, and practical assignments for the course
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2 font-serif tracking-wide print:text-xl">
            {courseTitle}
          </h3>
        </div>

        {/* Bottom Section: Signatures & Seal */}
        <div className="grid grid-cols-3 gap-4 items-end mt-12 print:mt-8">
          {/* Date */}
          <div className="text-left">
            <div className="border-b border-slate-400 pb-1 text-slate-800 font-medium text-sm font-serif">
              {currentDate}
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider block mt-1">Date</span>
          </div>

          {/* Gold Seal */}
          <div className="flex justify-center select-none">
            <div className="relative w-24 h-24 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-200">
              <div className="absolute w-20 h-20 rounded-full border-2 border-dashed border-amber-100 flex items-center justify-center text-center">
                <span className="text-white font-extrabold text-[10px] tracking-wider uppercase font-serif">
                  EXCELLENCE
                </span>
              </div>
              {/* Ribbon Tails */}
              <div className="absolute -bottom-4 -left-1 w-6 h-12 bg-amber-600 clip-ribbon transform -rotate-12 z-[-1]"></div>
              <div className="absolute -bottom-4 -right-1 w-6 h-12 bg-amber-700 clip-ribbon transform rotate-12 z-[-1]"></div>
            </div>
          </div>

          {/* Instructor Signature */}
          <div className="text-right">
            <div className="border-b border-slate-400 pb-1 text-slate-800 font-serif italic text-sm font-semibold">
              VoiceLMS Academic Board
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider block mt-1">Authorized Signature</span>
          </div>
        </div>

        {/* Print Button (Hidden when printing) */}
        <div className="mt-8 flex justify-center space-x-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <span>🖨️ Print Certificate</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>

      {/* Tailwind specific custom clip-ribbon styling for gold seal */}
      <style>{`
        .clip-ribbon {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
