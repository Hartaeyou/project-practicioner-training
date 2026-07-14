import { useState } from 'react';
import { Network, FileText, Zap, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const networkNodes = [
  { id: 'center', label: 'Toko Cahaya\nMandiri', x: 50, y: 50, type: 'center', score: 88 },
  { id: 'supplier-a', label: 'Pemasok A', x: 20, y: 30, type: 'supplier', score: 92 },
  { id: 'distributor-b', label: 'Distributor B', x: 80, y: 35, type: 'distributor', score: 85 },
  { id: 'logistics-c', label: 'Logistik C', x: 65, y: 75, type: 'logistics', score: 78 },
  { id: 'partner-d', label: 'Mitra D', x: 30, y: 70, type: 'partner', score: 81 },
];

const connections = [
  { from: 'center', to: 'supplier-a', strength: 0.9 },
  { from: 'center', to: 'distributor-b', strength: 0.85 },
  { from: 'center', to: 'logistics-c', strength: 0.75 },
  { from: 'center', to: 'partner-d', strength: 0.8 },
];

export default function TrustNetworkAnalysis() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    toast.loading('Membuat laporan risiko...', { id: 'report-generation' });

    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Laporan berhasil dibuat!', {
        id: 'report-generation',
        description: 'Laporan analisis risiko telah siap untuk diunduh',
      });
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analisis Jaringan Kepercayaan</h1>
        <p className="text-sm text-gray-500 mt-1">Visualisasi ekosistem bisnis dan hubungan mitra</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Network Visualization - Left Side */}
        <div className="col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" />
              Peta Jaringan Bisnis
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span>Kuat</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>Sedang</span>
              </div>
            </div>
          </div>

          {/* SVG Network Graph */}
          <div className="relative bg-gray-800/50 rounded-lg p-4" style={{ height: '400px' }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>

              {/* Connections */}
              {connections.map((conn, idx) => {
                const fromNode = networkNodes.find(n => n.id === conn.from);
                const toNode = networkNodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                return (
                  <g key={idx}>
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="url(#lineGradient)"
                      strokeWidth={conn.strength * 0.4}
                      strokeDasharray={conn.strength > 0.8 ? "0" : "2,2"}
                      opacity={0.6}
                      filter="url(#glow)"
                    />
                    {/* Animated pulse */}
                    <circle r="1" fill="#10B981" opacity="0.8">
                      <animateMotion
                        dur={`${3 / conn.strength}s`}
                        repeatCount="indefinite"
                        path={`M ${fromNode.x},${fromNode.y} L ${toNode.x},${toNode.y}`}
                      />
                    </circle>
                  </g>
                );
              })}

              {/* Nodes */}
              {networkNodes.map((node) => (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glow ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.type === 'center' ? 8 : 5}
                    fill="none"
                    stroke={node.type === 'center' ? '#10B981' : '#3B82F6'}
                    strokeWidth="0.3"
                    opacity={hoveredNode === node.id ? 1 : 0.3}
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="r"
                      from={node.type === 'center' ? "8" : "5"}
                      to={node.type === 'center' ? "10" : "7"}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Main node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.type === 'center' ? 6 : 4}
                    fill={node.type === 'center' ? '#10B981' : '#3B82F6'}
                    filter="url(#glow)"
                    opacity={hoveredNode === node.id ? 1 : 0.9}
                  />

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + (node.type === 'center' ? 10 : 8)}
                    textAnchor="middle"
                    fill="white"
                    fontSize={node.type === 'center' ? "3.5" : "2.5"}
                    fontWeight={node.type === 'center' ? "bold" : "normal"}
                    opacity={hoveredNode === node.id ? 1 : 0.8}
                  >
                    {node.label.split('\n').map((line, i) => (
                      <tspan key={i} x={node.x} dy={i === 0 ? 0 : 3}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              ))}
            </svg>

            {/* Tooltip on hover */}
            {hoveredNode && (
              <div className="absolute top-4 right-4 bg-gray-900/95 border border-emerald-500/50 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-white text-sm font-semibold">
                  {networkNodes.find(n => n.id === hoveredNode)?.label.replace('\n', ' ')}
                </p>
                <p className="text-emerald-400 text-xs mt-1">
                  Skor: {networkNodes.find(n => n.id === hoveredNode)?.score}/100
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Insights Panel - Right Side */}
        <div className="space-y-4">
          {/* Relationship Strength */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Hubungan Pemasok</p>
                <p className="text-xl font-bold text-gray-900">Kuat</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[90%]"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">4 pemasok terverifikasi</p>
          </div>

          {/* Payment Timeliness */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Ketepatan Waktu Bayar</p>
                <p className="text-xl font-bold text-gray-900">95%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-[95%]"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">38 dari 40 transaksi tepat waktu</p>
          </div>

          {/* Trust Network Score */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Skor Jaringan Kepercayaan</p>
                <p className="text-xl font-bold text-gray-900">88/100</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-violet-600 w-[88%]"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Kategori: Sangat Baik</p>
          </div>

          {/* Generate Report CTA */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#1D4ED8] to-[#1e40af] text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Membuat Laporan...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Buat Laporan Risiko</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Detailed Relationship Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Hubungan Bisnis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama Mitra</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipe</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Durasi Kerjasama</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Volume Transaksi</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Pemasok A', type: 'Pemasok', duration: '3 Tahun', volume: 'Rp 450 Jt', score: 92, status: 'Aktif' },
                { name: 'Distributor B', type: 'Distributor', duration: '2 Tahun', volume: 'Rp 380 Jt', score: 85, status: 'Aktif' },
                { name: 'Logistik C', type: 'Logistik', duration: '1.5 Tahun', volume: 'Rp 120 Jt', score: 78, status: 'Aktif' },
                { name: 'Mitra D', type: 'Mitra Usaha', duration: '2.5 Tahun', volume: 'Rp 280 Jt', score: 81, status: 'Aktif' },
              ].map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.duration}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.volume}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
