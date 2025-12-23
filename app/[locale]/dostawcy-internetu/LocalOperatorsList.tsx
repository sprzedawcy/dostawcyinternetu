"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cleanOperatorName } from "@/src/lib/operator-utils";
import Pagination from "./Pagination";
import OperatorBadge from "./OperatorBadge";

interface Operator {
  id: number;
  nazwa: string;
  slug: string;
  typ: string | null;
  logo_url: string | null;
  regiony: string[] | null;
  strona_www: string | null;
  totalOffers: number;
}

interface Props {
  operators: Operator[];
}

export default function LocalOperatorsList({ operators }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Wykryj mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const perPage = isMobile ? 9 : 15;
  const totalPages = Math.ceil(operators.length / perPage);
  
  const paginatedOperators = operators.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll do sekcji
    document.getElementById('lokalni-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Grid operatorów */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {paginatedOperators.map((operator, index) => (
            <Link
              key={operator.id}
              href={`/dostawca-internetu/${operator.slug}`}
              className={`p-4 hover:bg-blue-50 transition-colors border-b border-gray-100 
                ${index % 5 !== 4 ? 'lg:border-r' : ''} 
                ${index % 3 !== 2 ? 'md:border-r lg:border-r-0' : 'md:border-r-0'}
                ${index % 2 !== 1 ? 'sm:border-r md:border-r-0' : 'sm:border-r-0'}
                lg:${index % 5 !== 4 ? 'border-r' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Logo / Inicjał */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {operator.logo_url ? (
                    <img src={operator.logo_url} alt="" className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {cleanOperatorName(operator.nazwa).charAt(0)}
                    </span>
                  )}
                </div>
                
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm truncate" title={cleanOperatorName(operator.nazwa)}>
                    {cleanOperatorName(operator.nazwa)}
                  </div>
                  
                  {/* Region */}
                  {operator.regiony && operator.regiony.length > 0 && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {operator.regiony[0]}
                    </div>
                  )}
                  
                  {/* Statystyki */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {operator.totalOffers > 0 ? (
                      <span className="text-xs text-blue-600 font-medium">{operator.totalOffers} ofert</span>
                    ) : (
                      <span className="text-xs text-gray-400">brak ofert</span>
                    )}
                    
                    {operator.strona_www && (
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Ma stronę WWW"></span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Paginacja */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={handlePageChange} 
      />
      
      {/* Info o ilości */}
      <div className="text-center text-sm text-gray-500 mt-4">
        Pokazano {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, operators.length)} z {operators.length} operatorów
      </div>
    </div>
  );
}
