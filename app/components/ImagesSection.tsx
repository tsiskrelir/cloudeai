'use client';

import React from 'react';
import { Icons } from './Icons';
import { Section } from './Section';
import type { AuditResult } from './types';

interface ImagesSectionProps {
  results: AuditResult;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ImagesSection = ({ results, expanded, setExpanded }: ImagesSectionProps) => {
  const imageList = results.images.imageList || [];
  const imagesWithoutAlt = imageList.filter((img) => !img.hasAlt);
  const imagesWithoutDimensions = imageList.filter((img) => !img.hasDimensions);
  const pngImages = results.images.pngList || [];
  const largeImages = results.images.imageSizeAnalysis?.largeList || [];

  return (
    <Section title="Images" icon={Icons.Image} id="images" expanded={expanded} setExpanded={setExpanded}>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg"><div className="text-2xl font-bold text-gray-700">{results.images.total}</div><div className="text-sm text-gray-600">Total</div></div>
        <div className={`text-center p-4 rounded-lg ${results.images.withoutAlt > 0 ? 'bg-red-50' : 'bg-green-50'}`}><div className={`text-2xl font-bold ${results.images.withoutAlt > 0 ? 'text-red-700' : 'text-green-700'}`}>{results.images.withoutAlt}</div><div className="text-sm text-gray-600">No alt</div></div>
        <div className={`text-center p-4 rounded-lg ${results.images.withoutDimensions > 0 ? 'bg-orange-50' : 'bg-green-50'}`}><div className={`text-2xl font-bold ${results.images.withoutDimensions > 0 ? 'text-orange-700' : 'text-green-700'}`}>{results.images.withoutDimensions}</div><div className="text-sm text-gray-600">No dimensions</div></div>
        <div className="text-center p-4 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-700">{results.images.lazyLoaded}</div><div className="text-sm text-green-600">Lazy loaded</div></div>
        <div className="text-center p-4 bg-teal-50 rounded-lg"><div className="text-2xl font-bold text-teal-700">{results.images.modernFormats || 0}</div><div className="text-sm text-teal-600">WebP/AVIF</div></div>
        <div className={`text-center p-4 rounded-lg ${(results.images.imageSizeAnalysis?.oldFormatCount || 0) > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className={`text-2xl font-bold ${(results.images.imageSizeAnalysis?.oldFormatCount || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}`}>{results.images.imageSizeAnalysis?.oldFormatCount || 0}</div>
          <div className="text-sm text-gray-600">PNG/JPG</div>
        </div>
      </div>

      {/* PNG/JPG Warning */}
      {results.images.imageSizeAnalysis && results.images.imageSizeAnalysis.oldFormatCount > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600"><Icons.Alert /></span>
            <div>
              <div className="font-medium text-yellow-800">Image Format Warning</div>
              <div className="text-sm text-yellow-700 mt-1">
                {results.images.imageSizeAnalysis.oldFormatCount} images are using PNG/JPG format. Consider converting to WebP or AVIF for better performance (30-50% smaller file sizes).
              </div>
              {results.images.imageSizeAnalysis.oldFormatList && results.images.imageSizeAnalysis.oldFormatList.length > 0 && (
                <div className="mt-2 max-h-32 overflow-auto">
                  {results.images.imageSizeAnalysis.oldFormatList.slice(0, 5).map((img, i) => (
                    <div key={i} className="text-xs text-yellow-600 truncate">• {img.src} ({img.type})</div>
                  ))}
                  {results.images.imageSizeAnalysis.oldFormatList.length > 5 && (
                    <div className="text-xs text-yellow-500 mt-1">...and {results.images.imageSizeAnalysis.oldFormatList.length - 5} more</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {imageList.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">Image inventory ({imageList.length})</summary>
          <div className="mt-2 max-h-72 overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-600 sticky top-0">
                <tr>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Alt</th>
                  <th className="text-left p-2">Dimensions</th>
                  <th className="text-left p-2">ID/Class</th>
                  <th className="text-left p-2">Format</th>
                  <th className="text-left p-2">Flags</th>
                </tr>
              </thead>
              <tbody>
                {imageList.map((img, i) => (
                  <tr key={`${img.src}-${i}`} className="border-t border-gray-100">
                    <td className="p-2 truncate max-w-[240px]" title={img.src}>{img.src || '(empty src)'}</td>
                    <td className="p-2 truncate max-w-[160px]" title={img.alt}>{img.alt || '—'}</td>
                    <td className="p-2">{img.width && img.height ? `${img.width}×${img.height}` : '—'}</td>
                    <td className="p-2">
                      <div className="truncate max-w-[160px]" title={`${img.id || ''} ${img.className || ''}`.trim()}>
                        {img.id ? `#${img.id}` : '—'}{img.className ? ` .${img.className.split(' ').slice(0, 2).join('.')}` : ''}
                      </div>
                    </td>
                    <td className="p-2">{img.format || '—'}</td>
                    <td className="p-2">
                      {!img.hasAlt && <span className="mr-2 text-red-600">no alt</span>}
                      {!img.hasDimensions && <span className="mr-2 text-orange-600">no dims</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {imagesWithoutAlt.length > 0 && (
          <details className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-red-800">Images missing alt ({imagesWithoutAlt.length})</summary>
            <div className="mt-2 max-h-40 overflow-auto text-xs text-red-700 space-y-1">
              {imagesWithoutAlt.map((img, i) => (
                <div key={`${img.src}-alt-${i}`} className="truncate">• {img.src || '(empty src)'} {img.id ? `(id="${img.id}")` : '(id missing)'}</div>
              ))}
            </div>
          </details>
        )}
        {imagesWithoutDimensions.length > 0 && (
          <details className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-orange-800">Images without dimensions ({imagesWithoutDimensions.length})</summary>
            <div className="mt-2 max-h-40 overflow-auto text-xs text-orange-700 space-y-1">
              {imagesWithoutDimensions.map((img, i) => (
                <div key={`${img.src}-dim-${i}`} className="truncate">• {img.src || '(empty src)'} {img.id ? `(id="${img.id}")` : '(id missing)'}</div>
              ))}
            </div>
          </details>
        )}
        {pngImages.length > 0 && (
          <details className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-yellow-800">PNG images ({pngImages.length})</summary>
            <div className="mt-2 max-h-40 overflow-auto text-xs text-yellow-700 space-y-1">
              {pngImages.map((img, i) => (
                <div key={`${img.src}-png-${i}`} className="truncate">• {img.src || '(empty src)'} {img.id ? `(id="${img.id}")` : '(id missing)'}</div>
              ))}
            </div>
          </details>
        )}
        {largeImages.length > 0 && (
          <details className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-purple-800">Large image files ({largeImages.length})</summary>
            <div className="mt-2 text-xs text-purple-700">Checked {results.images.imageSizeAnalysis?.checked || 0} image URLs.</div>
            <div className="mt-2 max-h-40 overflow-auto text-xs text-purple-700 space-y-1">
              {largeImages.map((img, i) => (
                <div key={`${img.src}-large-${i}`} className="truncate">• {img.src} ({img.size})</div>
              ))}
            </div>
          </details>
        )}
      </div>
    </Section>
  );
};
