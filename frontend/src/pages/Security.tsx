import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { showErrorToast, showSuccessToast, showLoadingToast, dismissToast } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SecurityAnalysis {
  protocolName: string;
  contractAddress: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  issues: SecurityIssue[];
  auditStatus: 'audited' | 'unaudited' | 'partially_audited';
  auditFirms: string[];
  lastAnalyzed: Date;
  recommendations: string[];
}

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  impact: string;
  recommendation: string;
}

interface KnownProtocol {
  name: string;
  slug: string;
  category: string;
  riskLevel: string;
  auditStatus: string;
  description: string;
}

const Security: React.FC = () => {
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [knownProtocols, setKnownProtocols] = useState<KnownProtocol[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKnownProtocols = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SECURITY_PROTOCOLS);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKnownProtocols(result.data);
        }
      }
    } catch (err) {
      logger.error('Failed to fetch known protocols:', err);
    }
  };

  const analyzeProtocol = async (protocolName: string) => {
    setLoading(true);
    setError(null);
    const toastId = showLoadingToast(`Analyzing ${protocolName}...`);

    try {
      const response = await fetch(API_ENDPOINTS.SECURITY_ANALYZE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ protocol: protocolName }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze protocol');
      }

      const result = await response.json();
      if (result.success) {
        setAnalysis({
          ...result.data,
          lastAnalyzed: new Date(result.data.lastAnalyzed)
        });
        showSuccessToast(`${protocolName} analyzed successfully`);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      showErrorToast(err, `Failed to analyze ${protocolName}`);
    } finally {
      dismissToast(toastId);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadProtocols = async () => {
      if (isMounted) {
        await fetchKnownProtocols();
      }
    };
    
    loadProtocols();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Info className="w-4 h-4 text-blue-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAuditStatusIcon = (status: string) => {
    switch (status) {
      case 'audited': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partially_audited': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unaudited': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Analysis</h1>
          <p className="text-gray-600">
            Analyze DeFi protocols and smart contracts for security risks
          </p>
        </div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Analyze Protocol Security
        </h2>
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter protocol name or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  analyzeProtocol(searchQuery.trim());
                }
              }}
            />
          </div>
          <button
            onClick={() => searchQuery.trim() && analyzeProtocol(searchQuery.trim())}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>Analyze</span>
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {analysis.protocolName}
                </h2>
                <p className="text-sm text-gray-500 font-mono">
                  {analysis.contractAddress}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel.toUpperCase()} RISK
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {analysis.riskScore}/100
                  </div>
                  <div className="text-sm text-gray-500">Risk Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Audit Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                {getAuditStatusIcon(analysis.auditStatus)}
                <span className="ml-2">Audit Status</span>
              </h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  analysis.auditStatus === 'audited' ? 'bg-green-100 text-green-800' :
                  analysis.auditStatus === 'partially_audited' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analysis.auditStatus.replace('_', ' ').toUpperCase()}
                </span>
                {analysis.auditFirms.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Audited by: {analysis.auditFirms.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Security Issues */}
            {analysis.issues.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Security Issues ({analysis.issues.length})
                </h3>
                <div className="space-y-3">
                  {analysis.issues.map((issue, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {issue.category}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(issue.severity)}`}>
                              {issue.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {issue.description}
                          </p>
                          <div className="text-sm">
                            <div className="text-gray-600 mb-1">
                              <strong>Impact:</strong> {issue.impact}
                            </div>
                            <div className="text-blue-600">
                              <strong>Recommendation:</strong> {issue.recommendation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-500" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Info */}
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Last analyzed: {new Date(analysis.lastAnalyzed).toLocaleString()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Known Protocols */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Known Protocols</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on any protocol to analyze its security
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {knownProtocols.map((protocol, index) => (
            <div
              key={protocol.slug}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                setSearchQuery(protocol.slug);
                analyzeProtocol(protocol.slug);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {protocol.name.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{protocol.name}</div>
                    <div className="text-sm text-gray-500">{protocol.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(protocol.riskLevel)}`}>
                    {protocol.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">
                    {protocol.category}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Security;
