import React, { useState, useCallback, useMemo } from 'react';
import './App.css';
import { FaHome, FaBuilding, FaCalculator, FaDollarSign, FaChartLine, FaTrendingUp } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const dealTypes = {
  residential: [
    { id: 'rental', label: 'Buy & Hold Rental', icon: '🏠' },
    { id: 'flip', label: 'Fix & Flip', icon: '🔨' },
    { id: 'wholesale', label: 'Wholesale', icon: '📋' },
    { id: 'brrrr', label: 'BRRRR', icon: '🔄' },
    { id: 'livein', label: 'House Hack', icon: '🏡' }
  ],
  commercial: [
    { id: 'multifamily', label: 'Multifamily', icon: '🏢' },
    { id: 'office', label: 'Office Building', icon: '🏢' },
    { id: 'retail', label: 'Retail Space', icon: '🏪' },
    { id: 'industrial', label: 'Industrial', icon: '🏭' },
    { id: 'mixed', label: 'Mixed Use', icon: '🏬' }
  ]
};

const initialFormData = {
  // Property Details
  address: '',
  purchasePrice: '',
  downPayment: '',
  loanAmount: '',
  interestRate: '',
  loanTerm: '',
  
  // Balloon Payment Options
  hasBaloonPayment: false,
  balloonAmount: '',
  balloonTerm: '',
  paymentType: 'principal_interest', // 'principal_interest', 'interest_only', 'partial_amortization'
  amortizationPeriod: '',
  
  // Income (for rentals)
  monthlyRent: '',
  otherIncome: '',
  vacancyRate: '',
  
  // Expenses
  propertyTaxes: '',
  insurance: '',
  maintenance: '',
  capex: '',
  management: '',
  utilities: '',
  hoa: '',
  
  // For Fix & Flip
  rehabCost: '',
  holdingCosts: '',
  sellingCosts: '',
  arv: '',
  
  // For Wholesale
  contractPrice: '',
  assignmentFee: '',
  
  // Commercial specific
  units: '',
  avgRentPerUnit: '',
  operatingExpenses: '',
  noi: ''
};

function RealEstateCalculator() {
  const [activeTab, setActiveTab] = useState('residential');
  const [selectedDealType, setSelectedDealType] = useState('rental');
  const [formData, setFormData] = useState(initialFormData);
  const [results, setResults] = useState(null);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const calculateMetrics = useCallback(() => {
    const data = { ...formData };
    
    // Convert strings to numbers
    Object.keys(data).forEach(key => {
      if (data[key] !== '' && !isNaN(data[key])) {
        data[key] = parseFloat(data[key]) || 0;
      }
    });

    const calculations = {};

    if (selectedDealType === 'rental' || selectedDealType === 'brrrr' || selectedDealType === 'livein') {
      // Rental Property Calculations
      const monthlyIncome = data.monthlyRent * (1 - (data.vacancyRate / 100)) + (data.otherIncome || 0);
      const monthlyExpenses = (data.propertyTaxes / 12) + (data.insurance / 12) + 
                             data.maintenance + data.capex + data.management + 
                             data.utilities + data.hoa;
      
      // Calculate monthly payment based on loan type
      let monthlyPI = 0;
      if (data.loanAmount > 0 && data.interestRate > 0) {
        const monthlyRate = data.interestRate / 100 / 12;
        
        if (data.hasBaloonPayment) {
          if (data.paymentType === 'interest_only') {
            // Interest-only payments
            monthlyPI = data.loanAmount * monthlyRate;
          } else if (data.paymentType === 'partial_amortization') {
            // Partial amortization over longer period
            const amortMonths = (data.amortizationPeriod || 30) * 12;
            monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, amortMonths)) /
                       (Math.pow(1 + monthlyRate, amortMonths) - 1);
          } else {
            // Regular amortization over balloon term
            const balloonMonths = data.balloonTerm * 12;
            monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, balloonMonths)) /
                       (Math.pow(1 + monthlyRate, balloonMonths) - 1);
          }
        } else {
          // Standard amortizing loan
          const loanMonths = data.loanTerm * 12;
          monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
                     (Math.pow(1 + monthlyRate, loanMonths) - 1);
        }
      }
      
      const totalMonthlyExpenses = monthlyExpenses + monthlyPI;
      const monthlyCashFlow = monthlyIncome - totalMonthlyExpenses;
      const annualCashFlow = monthlyCashFlow * 12;
      const totalCashInvested = data.downPayment + (data.rehabCost || 0);
      
      // Calculate balloon payment amount if applicable
      let balloonPaymentAmount = 0;
      if (data.hasBaloonPayment && data.loanAmount > 0) {
        if (data.paymentType === 'interest_only') {
          balloonPaymentAmount = data.loanAmount; // Full principal balance
        } else if (data.paymentType === 'partial_amortization') {
          // Calculate remaining balance after partial amortization
          const monthlyRate = data.interestRate / 100 / 12;
          const amortMonths = (data.amortizationPeriod || 30) * 12;
          const balloonMonths = data.balloonTerm * 12;
          const monthlyPayment = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, amortMonths)) /
                                (Math.pow(1 + monthlyRate, amortMonths) - 1);
          
          // Remaining balance calculation
          const remainingBalance = data.loanAmount * Math.pow(1 + monthlyRate, balloonMonths) - 
                                  monthlyPayment * ((Math.pow(1 + monthlyRate, balloonMonths) - 1) / monthlyRate);
          balloonPaymentAmount = Math.max(0, remainingBalance);
        } else {
          balloonPaymentAmount = data.balloonAmount || data.loanAmount;
        }
      }
      
      // Key Metrics
      calculations.monthlyCashFlow = monthlyCashFlow;
      calculations.annualCashFlow = annualCashFlow;
      calculations.capRate = data.purchasePrice > 0 ? ((monthlyIncome * 12 - monthlyExpenses * 12) / data.purchasePrice) * 100 : 0;
      calculations.cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
      calculations.totalROI = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
      calculations.onePercentRule = data.purchasePrice > 0 ? (data.monthlyRent / data.purchasePrice) * 100 : 0;
      calculations.grossRentMultiplier = data.monthlyRent > 0 ? data.purchasePrice / (data.monthlyRent * 12) : 0;
      calculations.dscr = monthlyPI > 0 ? monthlyIncome / monthlyPI : 0;
      
      // Balloon payment specific metrics
      calculations.hasBaloonPayment = data.hasBaloonPayment;
      calculations.balloonPaymentAmount = balloonPaymentAmount;
      calculations.balloonTerm = data.balloonTerm;
      calculations.paymentType = data.paymentType;
      calculations.monthlyPI = monthlyPI;
      
      // Break-even analysis
      calculations.breakEvenRent = totalMonthlyExpenses;
      calculations.monthlyIncome = monthlyIncome;
      calculations.totalMonthlyExpenses = totalMonthlyExpenses;
      calculations.totalCashInvested = totalCashInvested;
      
      // Balloon payment planning
      if (data.hasBaloonPayment) {
        calculations.balloonPaymentPerMonth = balloonPaymentAmount / (data.balloonTerm * 12);
        calculations.totalCashNeededAtBalloon = balloonPaymentAmount;
        calculations.balloonPaymentRatio = data.purchasePrice > 0 ? (balloonPaymentAmount / data.purchasePrice) * 100 : 0;
      }
      
    } else if (selectedDealType === 'flip') {
      // Fix & Flip Calculations
      const totalInvestment = data.purchasePrice + data.rehabCost + data.holdingCosts;
      const netProfit = data.arv - totalInvestment - data.sellingCosts;
      const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      
      calculations.totalInvestment = totalInvestment;
      calculations.netProfit = netProfit;
      calculations.roi = roi;
      calculations.arv = data.arv;
      calculations.totalCosts = totalInvestment + data.sellingCosts;
      
    } else if (selectedDealType === 'wholesale') {
      // Wholesale Calculations
      const profit = data.assignmentFee;
      const roi = data.contractPrice > 0 ? (profit / data.contractPrice) * 100 : 0;
      
      calculations.profit = profit;
      calculations.roi = roi;
      calculations.contractPrice = data.contractPrice;
      calculations.assignmentFee = data.assignmentFee;
    }

    setResults(calculations);
  }, [formData, selectedDealType]);

  const renderInputField = (label, field, type = 'number', prefix = '$') => (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full ${prefix ? 'pl-8' : 'pl-3'} pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="0"
        />
      </div>
    </div>
  );

  const renderBasicInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="md:col-span-2 lg:col-span-3">
        {renderInputField('Property Address', 'address', 'text', '')}
      </div>
      {renderInputField('Purchase Price', 'purchasePrice')}
      {renderInputField('Down Payment', 'downPayment')}
      {renderInputField('Loan Amount', 'loanAmount')}
      {renderInputField('Interest Rate', 'interestRate', 'number', '%')}
      {renderInputField('Loan Term (Years)', 'loanTerm', 'number', '')}
      
      {/* Balloon Payment Section */}
      <div className="md:col-span-2 lg:col-span-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
          🎈 Balloon Payment Options
        </h4>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.hasBaloonPayment}
              onChange={(e) => handleInputChange('hasBaloonPayment', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">This loan has a balloon payment</span>
          </label>
        </div>
        
        {formData.hasBaloonPayment && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Type
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => handleInputChange('paymentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="principal_interest">Principal & Interest</option>
                <option value="interest_only">Interest Only</option>
                <option value="partial_amortization">Partial Amortization</option>
              </select>
            </div>
            
            {renderInputField('Balloon Due (Years)', 'balloonTerm', 'number', '')}
            
            {formData.paymentType === 'partial_amortization' && 
              renderInputField('Amortization Period (Years)', 'amortizationPeriod', 'number', '')
            }
            
            {formData.paymentType === 'principal_interest' && 
              renderInputField('Balloon Amount', 'balloonAmount')
            }
          </div>
        )}
      </div>
    </div>
  );

  const renderRentalInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-green-50 p-4 rounded-lg lg:col-span-3">
        <h4 className="font-semibold text-green-800 mb-3 flex items-center">
          <FaDollarSign className="mr-2" /> Income
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInputField('Monthly Rent', 'monthlyRent')}
          {renderInputField('Other Monthly Income', 'otherIncome')}
          {renderInputField('Vacancy Rate', 'vacancyRate', 'number', '%')}
        </div>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg lg:col-span-3">
        <h4 className="font-semibold text-red-800 mb-3">Expenses</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInputField('Property Taxes (Annual)', 'propertyTaxes')}
          {renderInputField('Insurance (Annual)', 'insurance')}
          {renderInputField('Maintenance (Monthly)', 'maintenance')}
          {renderInputField('CapEx (Monthly)', 'capex')}
          {renderInputField('Management (Monthly)', 'management')}
          {renderInputField('Utilities (Monthly)', 'utilities')}
          {renderInputField('HOA (Monthly)', 'hoa')}
        </div>
      </div>
    </div>
  );

  const renderFlipInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-3">Rehab & Costs</h4>
        {renderInputField('Rehab Cost', 'rehabCost')}
        {renderInputField('Holding Costs', 'holdingCosts')}
        {renderInputField('Selling Costs', 'sellingCosts')}
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-3">Sale</h4>
        {renderInputField('After Repair Value (ARV)', 'arv')}
      </div>
    </div>
  );

  const renderWholesaleInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderInputField('Contract Price', 'contractPrice')}
      {renderInputField('Assignment Fee', 'assignmentFee')}
    </div>
  );

  const renderCommercialInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg lg:col-span-3">
        <h4 className="font-semibold text-blue-800 mb-3">Commercial Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInputField('Number of Units', 'units', 'number', '')}
          {renderInputField('Avg Rent per Unit', 'avgRentPerUnit')}
          {renderInputField('Operating Expenses', 'operatingExpenses')}
          {renderInputField('Net Operating Income', 'noi')}
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    const formatCurrency = (value) => 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
    
    const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;

    if (selectedDealType === 'rental' || selectedDealType === 'brrrr' || selectedDealType === 'livein') {
      const chartData = [
        { name: 'Monthly Income', value: results.monthlyIncome || 0 },
        { name: 'Monthly Expenses', value: results.totalMonthlyExpenses || 0 },
        { name: 'Cash Flow', value: results.monthlyCashFlow || 0 }
      ];

      const metricsData = [
        { name: 'Cap Rate', value: results.capRate },
        { name: 'Cash-on-Cash', value: results.cashOnCashReturn },
        { name: '1% Rule', value: results.onePercentRule }
      ];

      return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FaChartLine className="mr-3 text-blue-600" />
            Investment Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Key Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-medium">Monthly Cash Flow:</span>
                  <span className={`font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.monthlyCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">Annual Cash Flow:</span>
                  <span className={`font-bold ${results.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.annualCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="font-medium">Cap Rate:</span>
                  <span className="font-bold text-gray-800">{formatPercent(results.capRate)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="font-medium">Cash-on-Cash Return:</span>
                  <span className="font-bold text-gray-800">{formatPercent(results.cashOnCashReturn)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                  <span className="font-medium">1% Rule:</span>
                  <span className={`font-bold ${results.onePercentRule >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(results.onePercentRule)}
                  </span>
                </div>
              </div>
              
              {/* Balloon Payment Warning */}
              {results.hasBaloonPayment && (
                <div className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                  <h5 className="font-semibold text-orange-800 mb-2 flex items-center">
                    ⚠️ Balloon Payment Alert
                  </h5>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p><strong>Payment Type:</strong> {results.paymentType.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Balloon Due:</strong> {results.balloonTerm} years</p>
                    <p><strong>Balloon Amount:</strong> {formatCurrency(results.balloonPaymentAmount)}</p>
                    <p><strong>Monthly Savings Needed:</strong> {formatCurrency(results.balloonPaymentPerMonth)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cash Flow Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Monthly Cash Flow</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Payment Details */}
              {results.hasBaloonPayment && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h6 className="font-semibold text-gray-700 mb-2">Payment Structure</h6>
                  <div className="text-sm text-gray-600">
                    <p>Monthly P&I: {formatCurrency(results.monthlyPI)}</p>
                    <p>Payment Type: {results.paymentType.replace('_', ' ')}</p>
                    {results.paymentType === 'interest_only' && (
                      <p className="text-orange-600 font-medium">
                        ⚠️ Interest-only payments - Principal balance remains {formatCurrency(results.balloonPaymentAmount)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h5 className="font-semibold text-gray-600">Break-Even Rent</h5>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.breakEvenRent)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h5 className="font-semibold text-gray-600">Gross Rent Multiplier</h5>
              <p className="text-2xl font-bold text-green-600">{results.grossRentMultiplier?.toFixed(2) || '0'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <h5 className="font-semibold text-gray-600">Total Cash Invested</h5>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(results.totalCashInvested)}</p>
            </div>
          </div>
          
          {/* Balloon Payment Planning Section */}
          {results.hasBaloonPayment && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                🎈 Balloon Payment Planning
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="font-medium">Balloon Amount:</span>
                    <span className="font-bold text-orange-600">{formatCurrency(results.balloonPaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="font-medium">Due in:</span>
                    <span className="font-bold text-red-600">{results.balloonTerm} years</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">Monthly Savings Goal:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(results.balloonPaymentPerMonth)}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h6 className="font-semibold text-yellow-800 mb-2">Exit Strategy Options:</h6>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Refinance before balloon due date</li>
                    <li>• Sell property to pay balloon</li>
                    <li>• Save monthly to pay balloon in cash</li>
                    <li>• Negotiate loan extension with lender</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedDealType === 'flip') {
      const profitData = [
        { name: 'Total Investment', value: results.totalInvestment },
        { name: 'ARV', value: results.arv },
        { name: 'Net Profit', value: results.netProfit }
      ];

      return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FaTrendingUp className="mr-3 text-green-600" />
            Fix & Flip Analysis
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Profit Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-medium">Total Investment:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(results.totalInvestment)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="font-medium">After Repair Value:</span>
                  <span className="font-bold text-green-600">{formatCurrency(results.arv)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="font-medium">Net Profit:</span>
                  <span className={`font-bold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="font-medium">ROI:</span>
                  <span className="font-bold text-purple-600">{formatPercent(results.roi)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Investment Breakdown</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    if (selectedDealType === 'wholesale') {
      return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Wholesale Analysis</h3>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-600">Contract Price</h4>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.contractPrice)}</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-600">Assignment Fee</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(results.assignmentFee)}</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-600">ROI</h4>
                <p className="text-2xl font-bold text-purple-600">{formatPercent(results.roi)}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <FaCalculator className="mr-4 text-blue-600" />
            Real Estate Deal Analyzer
          </h1>
          <p className="text-xl text-gray-600">Comprehensive analysis for residential and commercial investments</p>
        </div>

        {/* Property Type Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-lg p-1">
            <button
              onClick={() => setActiveTab('residential')}
              className={`px-6 py-3 rounded-md flex items-center transition-all ${
                activeTab === 'residential'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaHome className="mr-2" />
              Residential
            </button>
            <button
              onClick={() => setActiveTab('commercial')}
              className={`px-6 py-3 rounded-md flex items-center transition-all ${
                activeTab === 'commercial'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaBuilding className="mr-2" />
              Commercial
            </button>
          </div>
        </div>

        {/* Deal Type Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Select Deal Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dealTypes[activeTab].map(deal => (
              <button
                key={deal.id}
                onClick={() => setSelectedDealType(deal.id)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedDealType === deal.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{deal.icon}</div>
                <div className="font-medium text-sm">{deal.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Details</h2>
          
          {/* Basic Inputs */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
            {renderBasicInputs()}
          </div>

          {/* Deal-specific inputs */}
          {(selectedDealType === 'rental' || selectedDealType === 'brrrr' || selectedDealType === 'livein') && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Rental Details</h3>
              {renderRentalInputs()}
            </div>
          )}

          {selectedDealType === 'flip' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Fix & Flip Details</h3>
              {renderFlipInputs()}
            </div>
          )}

          {selectedDealType === 'wholesale' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Wholesale Details</h3>
              {renderWholesaleInputs()}
            </div>
          )}

          {activeTab === 'commercial' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Commercial Details</h3>
              {renderCommercialInputs()}
            </div>
          )}

          {/* Calculate Button */}
          <div className="text-center">
            <button
              onClick={calculateMetrics}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all hover:shadow-xl flex items-center mx-auto"
            >
              <FaCalculator className="mr-2" />
              Calculate Deal Metrics
            </button>
          </div>
        </div>

        {/* Results */}
        {renderResults()}
      </div>
    </div>
  );
}

export default RealEstateCalculator;