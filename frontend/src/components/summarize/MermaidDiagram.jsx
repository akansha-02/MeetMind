// import React, { useEffect, useRef, useState } from 'react';
// import mermaid from 'mermaid';

// export const MermaidDiagram = ({ diagram, id }) => {
//   const diagramRef = useRef(null);
//   const [error, setError] = useState(null);
//   const diagramId = `mermaid-${id || Date.now()}`;

//   useEffect(() => {
//     if (!diagram || !diagramRef.current) return;

//     // Initialize Mermaid once
//     mermaid.initialize({ 
//       startOnLoad: false,
//       theme: 'default',
//       securityLevel: 'loose',
//     });

//     const renderDiagram = async () => {
//       try {
//         setError(null);
//         // Clean the diagram code (remove markdown code blocks if present)
//         let cleanDiagram = diagram.trim();
//         if (cleanDiagram.startsWith('```mermaid')) {
//           cleanDiagram = cleanDiagram.replace(/```mermaid\n?/g, '').replace(/```\n?$/g, '');
//         } else if (cleanDiagram.startsWith('```')) {
//           cleanDiagram = cleanDiagram.replace(/```\n?/g, '');
//         }

//         // Clear previous content
//         diagramRef.current.innerHTML = '';

//         // Render the diagram
//         const { svg } = await mermaid.render(diagramId, cleanDiagram);
//         if (diagramRef.current) {
//           diagramRef.current.innerHTML = svg;
//         }
//       } catch (error) {
//         console.error('Mermaid rendering error:', error);
//         setError('Error rendering diagram');
//         if (diagramRef.current) {
//           diagramRef.current.innerHTML = '<p class="text-red-500 text-sm">Error rendering diagram. Please check the diagram syntax.</p>';
//         }
//       }
//     };

//     renderDiagram();

//     // Cleanup function
//     return () => {
//       if (diagramRef.current) {
//         diagramRef.current.innerHTML = '';
//       }
//     };
//   }, [diagram, diagramId]);

//   if (!diagram) return null;

//   return (
//     <div className="my-4 p-4 bg-gray-50 rounded-lg overflow-x-auto">
//       {error && (
//         <p className="text-red-500 text-sm mb-2">{error}</p>
//       )}
//       <div ref={diagramRef} className="mermaid-diagram flex justify-center"></div>
//     </div>
//   );
// };

