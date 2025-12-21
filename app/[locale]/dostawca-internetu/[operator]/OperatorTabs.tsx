"use client";
import { useState } from "react";

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface Props {
  tabs: TabConfig[];
  children: React.ReactNode[];
  defaultTab?: string;
}

export default function OperatorTabs({ tabs, children, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || 'oferty');

  return (
    <div>
      {/* Desktop tabs */}
      <div className="hidden md:flex gap-1 mb-6 bg-gray-100 p-1.5 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 border-2 rounded-xl font-medium text-gray-900 bg-white"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.label} {tab.count ? `(${tab.count})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        {tabs.map((tab, index) => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            {children[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
