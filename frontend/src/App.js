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

const purchaseMethods = {
  traditional: [
    { id: 'conventional', label: 'Conventional Loan', icon: '🏦', description: 'Traditional bank financing' },
    { id: 'fha', label: 'FHA Loan', icon: '🏛️', description: 'Government-backed loan' },
    { id: 'va', label: 'VA Loan', icon: '🎖️', description: 'Veterans Affairs loan' },
    { id: 'hard_money', label: 'Hard Money', icon: '💰', description: 'Private short-term lending' },
    { id: 'cash', label: 'Cash Purchase', icon: '💵', description: 'All cash acquisition' }
  ],
  creative: [
    { id: 'subject_to', label: 'Subject-To (SubTo)', icon: '🔄', description: 'Take over existing mortgage payments' },
    { id: 'seller_finance', label: 'Seller Financing', icon: '🤝', description: 'Owner acts as the bank' },
    { id: 'wraparound', label: 'Wraparound Mortgage', icon: '🌯', description: 'New loan wraps existing mortgage' },
    { id: 'lease_option', label: 'Lease Option', icon: '📋', description: 'Lease with option to purchase' },
    { id: 'lease_purchase', label: 'Lease Purchase', icon: '📄', description: 'Lease with obligation to buy' },
    { id: 'contract_deed', label: 'Agreement for Deed', icon: '📜', description: 'Contract for deed arrangement' },
    { id: 'land_contract', label: 'Installment Land Contract', icon: '🏞️', description: 'Installment purchase agreement' },
    { id: 'master_lease', label: 'Master Lease Option (MLO)', icon: '🏢', description: 'Control multiple properties' },
    { id: 'novation', label: 'Novation Agreement', icon: '🔄', description: 'Contract replacement strategy' },
    { id: 'hybrid', label: 'Hybrid Deal', icon: '🔀', description: 'Combined strategies (SubTo + Seller Finance)' },
    { id: 'option_purchase', label: 'Option to Purchase', icon: '🎯', description: 'Standalone purchase option' },
    { id: 'trust_acquisition', label: 'Trust Acquisition', icon: '🏛️', description: 'Using trusts for acquisition' },
    { id: 'equity_sharing', label: 'Equity Sharing', icon: '🤝', description: 'Shared ownership agreement' },
    { id: 'performance_mortgage', label: 'Performance Mortgage', icon: '📈', description: 'Performance-based payments' }
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
  
  // Purchase Method
  purchaseMethod: 'conventional',
  
  // Balloon Payment Options
  hasBaloonPayment: false,
  balloonAmount: '',
  balloonTerm: '',
  paymentType: 'principal_interest', // 'principal_interest', 'interest_only', 'partial_amortization'
  amortizationPeriod: '',
  
  // Creative Financing Specific
  existingMortgageBalance: '', // For Subject-To, Wraparound
  existingMortgagePayment: '',
  existingMortgageRate: '',
  sellerFinanceTerms: '',
  leaseAmount: '', // For Lease Options
  optionFee: '',
  optionPeriod: '',
  rentCredit: '',
  performanceMetrics: '', // For Performance Mortgage
  equityShare: '', // For Equity Sharing
  trustStructure: '', // For Trust Acquisition
  
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
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] = useState('conventional');
  const [showCreativeFinancing, setShowCreativeFinancing] = useState(false);
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
      
      // Calculate monthly payment based on purchase method
      let monthlyPI = 0;
      let actualCashInvested = data.downPayment + (data.rehabCost || 0);
      
      // Purchase method specific calculations
      switch (selectedPurchaseMethod) {
        case 'subject_to':
          monthlyPI = data.existingMortgagePayment || 0;
          actualCashInvested = (data.optionFee || 0) + (data.rehabCost || 0); // Minimal cash
          break;
          
        case 'seller_finance':
          if (data.loanAmount > 0 && data.interestRate > 0) {
            const monthlyRate = data.interestRate / 100 / 12;
            const loanMonths = data.loanTerm * 12;
            monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
                       (Math.pow(1 + monthlyRate, loanMonths) - 1);
          }
          break;
          
        case 'wraparound':
          const existingPayment = data.existingMortgagePayment || 0;
          const wrapPayment = data.loanAmount > 0 ? 
            (data.loanAmount * (data.interestRate / 100 / 12) * Math.pow(1 + data.interestRate / 100 / 12, data.loanTerm * 12)) /
            (Math.pow(1 + data.interestRate / 100 / 12, data.loanTerm * 12) - 1) : 0;
          monthlyPI = wrapPayment;
          calculations.existingMortgagePayment = existingPayment;
          calculations.wrapAroundSpread = wrapPayment - existingPayment;
          break;
          
        case 'lease_option':
        case 'lease_purchase':
          monthlyPI = data.leaseAmount || 0;
          actualCashInvested = (data.optionFee || 0) + (data.rehabCost || 0);
          calculations.rentCredit = data.rentCredit || 0;
          calculations.optionPeriod = data.optionPeriod || 0;
          break;
          
        case 'contract_deed':
        case 'land_contract':
          if (data.loanAmount > 0 && data.interestRate > 0) {
            const monthlyRate = data.interestRate / 100 / 12;
            const loanMonths = data.loanTerm * 12;
            monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
                       (Math.pow(1 + monthlyRate, loanMonths) - 1);
          }
          actualCashInvested = data.downPayment; // Usually lower down payment
          break;
          
        case 'equity_sharing':
          if (data.loanAmount > 0 && data.interestRate > 0) {
            const monthlyRate = data.interestRate / 100 / 12;
            const loanMonths = data.loanTerm * 12;
            monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
                       (Math.pow(1 + monthlyRate, loanMonths) - 1);
          }
          calculations.equitySharePercentage = data.equityShare || 0;
          break;
          
        case 'performance_mortgage':
          // Performance-based payment calculation
          monthlyPI = data.monthlyRent > 0 ? (data.monthlyRent * (data.performanceMetrics / 100)) : 0;
          break;
          
        case 'cash':
          monthlyPI = 0;
          actualCashInvested = data.purchasePrice + (data.rehabCost || 0);
          break;
          
        default:
          // Traditional financing
          if (data.loanAmount > 0 && data.interestRate > 0) {
            const monthlyRate = data.interestRate / 100 / 12;
            
            if (data.hasBaloonPayment) {
              if (data.paymentType === 'interest_only') {
                monthlyPI = data.loanAmount * monthlyRate;
              } else if (data.paymentType === 'partial_amortization') {
                const amortMonths = (data.amortizationPeriod || 30) * 12;
                monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, amortMonths)) /
                           (Math.pow(1 + monthlyRate, amortMonths) - 1);
              } else {
                const balloonMonths = data.balloonTerm * 12;
                monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, balloonMonths)) /
                           (Math.pow(1 + monthlyRate, balloonMonths) - 1);
              }
            } else {
              const loanMonths = data.loanTerm * 12;
              monthlyPI = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanMonths)) /
                         (Math.pow(1 + monthlyRate, loanMonths) - 1);
            }
          }
      }
      
      const totalMonthlyExpenses = monthlyExpenses + monthlyPI;
      const monthlyCashFlow = monthlyIncome - totalMonthlyExpenses;
      const annualCashFlow = monthlyCashFlow * 12;
      const totalCashInvested = actualCashInvested;
      
      // Calculate balloon payment amount if applicable
      let balloonPaymentAmount = 0;
      if (data.hasBaloonPayment && data.loanAmount > 0 && selectedPurchaseMethod !== 'subject_to') {
        if (data.paymentType === 'interest_only') {
          balloonPaymentAmount = data.loanAmount;
        } else if (data.paymentType === 'partial_amortization') {
          const monthlyRate = data.interestRate / 100 / 12;
          const amortMonths = (data.amortizationPeriod || 30) * 12;
          const balloonMonths = data.balloonTerm * 12;
          const monthlyPayment = (data.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, amortMonths)) /
                                (Math.pow(1 + monthlyRate, amortMonths) - 1);
          
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
      
      // Purchase method specific data
      calculations.purchaseMethod = selectedPurchaseMethod;
      calculations.actualCashInvested = actualCashInvested;
      
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
      calculations.purchaseMethod = selectedPurchaseMethod;
      
    } else if (selectedDealType === 'wholesale') {
      // Wholesale Calculations
      const profit = data.assignmentFee;
      const roi = data.contractPrice > 0 ? (profit / data.contractPrice) * 100 : 0;
      
      calculations.profit = profit;
      calculations.roi = roi;
      calculations.contractPrice = data.contractPrice;
      calculations.assignmentFee = data.assignmentFee;
      calculations.purchaseMethod = selectedPurchaseMethod;
    }

    setResults(calculations);
  }, [formData, selectedDealType, selectedPurchaseMethod]);

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

  const renderCreativeFinancingInputs = () => {
    if (!showCreativeFinancing) return null;

    const renderMethodSpecificFields = () => {
      switch (selectedPurchaseMethod) {
        case 'subject_to':
          return (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                🔄 Subject-To Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Existing Mortgage Balance', 'existingMortgageBalance')}
                {renderInputField('Existing Monthly Payment', 'existingMortgagePayment')}
                {renderInputField('Existing Interest Rate', 'existingMortgageRate', 'number', '%')}
                {renderInputField('Option Fee (if any)', 'optionFee')}
              </div>
              <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-700">
                <strong>⚠️ Legal Notice:</strong> Subject-To deals carry significant legal and financial risks. 
                Consult with a qualified attorney before proceeding.
              </div>
            </div>
          );

        case 'seller_finance':
          return (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                🤝 Seller Financing Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Seller Finance Amount', 'loanAmount')}
                {renderInputField('Interest Rate', 'interestRate', 'number', '%')}
                {renderInputField('Term (Years)', 'loanTerm', 'number', '')}
                {renderInputField('Down Payment to Seller', 'downPayment')}
              </div>
            </div>
          );

        case 'wraparound':
          return (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                🌯 Wraparound Mortgage Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Existing Mortgage Balance', 'existingMortgageBalance')}
                {renderInputField('Existing Monthly Payment', 'existingMortgagePayment')}
                {renderInputField('Existing Interest Rate', 'existingMortgageRate', 'number', '%')}
                {renderInputField('Wraparound Loan Amount', 'loanAmount')}
                {renderInputField('Wraparound Interest Rate', 'interestRate', 'number', '%')}
                {renderInputField('Wraparound Term (Years)', 'loanTerm', 'number', '')}
              </div>
            </div>
          );

        case 'lease_option':
        case 'lease_purchase':
          return (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                📋 Lease Option Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Monthly Lease Amount', 'leaseAmount')}
                {renderInputField('Option Fee', 'optionFee')}
                {renderInputField('Option Period (Years)', 'optionPeriod', 'number', '')}
                {renderInputField('Monthly Rent Credit', 'rentCredit')}
                {renderInputField('Purchase Price', 'purchasePrice')}
              </div>
            </div>
          );

        case 'contract_deed':
        case 'land_contract':
          return (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                📜 Contract for Deed Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Contract Price', 'purchasePrice')}
                {renderInputField('Down Payment', 'downPayment')}
                {renderInputField('Contract Balance', 'loanAmount')}
                {renderInputField('Interest Rate', 'interestRate', 'number', '%')}
                {renderInputField('Term (Years)', 'loanTerm', 'number', '')}
              </div>
              <div className="mt-3 p-3 bg-purple-100 rounded text-sm text-purple-700">
                <strong>Note:</strong> Title transfers only after full payment is made.
              </div>
            </div>
          );

        case 'equity_sharing':
          return (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-800 mb-3 flex items-center">
                🤝 Equity Sharing Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Your Equity Share', 'equityShare', 'number', '%')}
                {renderInputField('Your Cash Investment', 'downPayment')}
                {renderInputField('Total Purchase Price', 'purchasePrice')}
                {renderInputField('Partner Contribution', 'loanAmount')}
              </div>
            </div>
          );

        case 'performance_mortgage':
          return (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                📈 Performance Mortgage Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Base Payment %', 'performanceMetrics', 'number', '%')}
                {renderInputField('Performance Threshold', 'monthlyRent')}
                {renderInputField('Loan Amount', 'loanAmount')}
                {renderInputField('Term (Years)', 'loanTerm', 'number', '')}
              </div>
              <div className="mt-3 p-3 bg-indigo-100 rounded text-sm text-indigo-700">
                <strong>Note:</strong> Payment amounts vary based on property performance metrics (NOI, occupancy, etc.).
              </div>
            </div>
          );

        case 'master_lease':
          return (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                🏢 Master Lease Option Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Monthly Master Lease', 'leaseAmount')}
                {renderInputField('Number of Units', 'units', 'number', '')}
                {renderInputField('Option Fee', 'optionFee')}
                {renderInputField('Option Period (Years)', 'optionPeriod', 'number', '')}
                {renderInputField('Total Purchase Price', 'purchasePrice')}
              </div>
            </div>
          );

        case 'trust_acquisition':
          return (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                🏛️ Trust Acquisition Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Trust Purchase Price', 'purchasePrice')}
                {renderInputField('Trust Setup Costs', 'optionFee')}
                {renderInputField('Monthly Trust Payments', 'leaseAmount')}
                {renderInputField('Trust Term (Years)', 'loanTerm', 'number', '')}
              </div>
              <div className="mt-3 p-3 bg-gray-100 rounded text-sm text-gray-700">
                <strong>Note:</strong> Property is held in trust structure for tax and legal benefits.
              </div>
            </div>
          );

        case 'hybrid':
          return (
            <div className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                🔀 Hybrid Deal Structure
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Existing Mortgage Balance', 'existingMortgageBalance')}
                {renderInputField('Existing Monthly Payment', 'existingMortgagePayment')}
                {renderInputField('Seller Finance Amount', 'loanAmount')}
                {renderInputField('Seller Finance Rate', 'interestRate', 'number', '%')}
                {renderInputField('Down Payment', 'downPayment')}
                {renderInputField('Option Fee', 'optionFee')}
              </div>
              <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-700">
                <strong>Example:</strong> Subject-To existing mortgage + Seller financing for equity difference.
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Creative Financing Details</h3>
        {renderMethodSpecificFields()}
      </div>
    );
  };

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

  const renderCreativeFinancingInputs = () => {
    if (!showCreativeFinancing) return null;

    const renderMethodSpecificFields = () => {
      switch (selectedPurchaseMethod) {
        case 'subject_to':
          return (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                🔄 Subject-To Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Existing Mortgage Balance', 'existingMortgageBalance')}
                {renderInputField('Existing Monthly Payment', 'existingMortgagePayment')}
                {renderInputField('Existing Interest Rate', 'existingMortgageRate', 'number', '%')}
                {renderInputField('Option Fee (if any)', 'optionFee')}
              </div>
              <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-700">
                <strong>⚠️ Legal Notice:</strong> Subject-To deals carry significant legal and financial risks. 
                Consult with a qualified attorney before proceeding.
              </div>
            </div>
          );

        case 'seller_finance':
          return (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                🤝 Seller Financing Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Seller Finance Amount', 'loanAmount')}
                {renderInputField('Interest Rate', 'interestRate', 'number', '%')}
                {renderInputField('Term (Years)', 'loanTerm', 'number', '')}
                {renderInputField('Down Payment to Seller', 'downPayment')}
              </div>
            </div>
          );

        case 'wraparound':
          return (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                🌯 Wraparound Mortgage Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Existing Mortgage Balance', 'existingMortgageBalance')}
                {renderInputField('Existing Monthly Payment', 'existingMortgagePayment')}
                {renderInputField('Existing Interest Rate', 'existingMortgageRate', 'number', '%')}
                {renderInputField('Wraparound Loan Amount', 'loanAmount')}
                {renderInputField('Wraparound Interest Rate', 'interestRate', 'number', '%')}
                {renderInputField('Wraparound Term (Years)', 'loanTerm', 'number', '')}
              </div>
            </div>
          );

        case 'lease_option':
        case 'lease_purchase':
          return (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                📋 Lease Option Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Monthly Lease Amount', 'leaseAmount')}
                {renderInputField('Option Fee', 'optionFee')}
                {renderInputField('Option Period (Years)', 'optionPeriod', 'number', '')}
                {renderInputField('Monthly Rent Credit', 'rentCredit')}
                {renderInputField('Purchase Price', 'purchasePrice')}
              </div>
            </div>
          );

        case 'contract_deed':
        case 'land_contract':
          return (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                📜 Contract for Deed Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Contract Price', 'purchasePrice')}
                {renderInputField('Down Payment', 'downPayment')}
                {renderInputField('Contract Balance', 'loanAmount')}
                {renderInputField('Interest Rate', 'interestRate', 'number', '%')}
                {renderInputField('Term (Years)', 'loanTerm', 'number', '')}
              </div>
              <div className="mt-3 p-3 bg-purple-100 rounded text-sm text-purple-700">
                <strong>Note:</strong> Title transfers only after full payment is made.
              </div>
            </div>
          );

        case 'equity_sharing':
          return (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-800 mb-3 flex items-center">
                🤝 Equity Sharing Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Your Equity Share', 'equityShare', 'number', '%')}
                {renderInputField('Your Cash Investment', 'downPayment')}
                {renderInputField('Total Purchase Price', 'purchasePrice')}
                {renderInputField('Partner Contribution', 'loanAmount')}
              </div>
            </div>
          );

        case 'performance_mortgage':
          return (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
                📈 Performance Mortgage Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Base Payment %', 'performanceMetrics', 'number', '%')}
                {renderInputField('Performance Threshold', 'monthlyRent')}
                {renderInputField('Loan Amount', 'loanAmount')}
                {renderInputField('Term (Years)', 'loanTerm', 'number', '')}
              </div>
              <div className="mt-3 p-3 bg-indigo-100 rounded text-sm text-indigo-700">
                <strong>Note:</strong> Payment amounts vary based on property performance metrics (NOI, occupancy, etc.).
              </div>
            </div>
          );

        case 'master_lease':
          return (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                🏢 Master Lease Option Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Monthly Master Lease', 'leaseAmount')}
                {renderInputField('Number of Units', 'units', 'number', '')}
                {renderInputField('Option Fee', 'optionFee')}
                {renderInputField('Option Period (Years)', 'optionPeriod', 'number', '')}
                {renderInputField('Total Purchase Price', 'purchasePrice')}
              </div>
            </div>
          );

        case 'trust_acquisition':
          return (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                🏛️ Trust Acquisition Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Trust Purchase Price', 'purchasePrice')}
                {renderInputField('Trust Setup Costs', 'optionFee')}
                {renderInputField('Monthly Trust Payments', 'leaseAmount')}
                {renderInputField('Trust Term (Years)', 'loanTerm', 'number', '')}
              </div>
              <div className="mt-3 p-3 bg-gray-100 rounded text-sm text-gray-700">
                <strong>Note:</strong> Property is held in trust structure for tax and legal benefits.
              </div>
            </div>
          );

        case 'hybrid':
          return (
            <div className="bg-gradient-to-r from-red-50 to-green-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                🔀 Hybrid Deal Structure
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField('Existing Mortgage Balance', 'existingMortgageBalance')}
                {renderInputField('Existing Monthly Payment', 'existingMortgagePayment')}
                {renderInputField('Seller Finance Amount', 'loanAmount')}
                {renderInputField('Seller Finance Rate', 'interestRate', 'number', '%')}
                {renderInputField('Down Payment', 'downPayment')}
                {renderInputField('Option Fee', 'optionFee')}
              </div>
              <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-700">
                <strong>Example:</strong> Subject-To existing mortgage + Seller financing for equity difference.
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Creative Financing Details</h3>
        {renderMethodSpecificFields()}
      </div>
    );
  };

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

        {/* Purchase Method Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Select Purchase Method</h2>
          
          {/* Traditional vs Creative Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowCreativeFinancing(false)}
                className={`px-6 py-2 rounded-md transition-all ${
                  !showCreativeFinancing
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Traditional Financing
              </button>
              <button
                onClick={() => setShowCreativeFinancing(true)}
                className={`px-6 py-2 rounded-md transition-all ${
                  showCreativeFinancing
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Creative Financing
              </button>
            </div>
          </div>

          {/* Purchase Method Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showCreativeFinancing ? purchaseMethods.creative : purchaseMethods.traditional).map(method => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedPurchaseMethod(method.id);
                  setFormData(prev => ({ ...prev, purchaseMethod: method.id }));
                }}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-left ${
                  selectedPurchaseMethod === method.id
                    ? showCreativeFinancing 
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <div className="font-semibold text-sm mb-1">{method.label}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Method Info */}
          {selectedPurchaseMethod && (
            <div className={`mt-4 p-4 rounded-lg border ${
              showCreativeFinancing 
                ? 'bg-purple-50 border-purple-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`font-semibold mb-2 ${
                showCreativeFinancing ? 'text-purple-800' : 'text-blue-800'
              }`}>
                Selected: {purchaseMethods[showCreativeFinancing ? 'creative' : 'traditional']
                  .find(m => m.id === selectedPurchaseMethod)?.label}
              </h4>
              <p className={`text-sm ${
                showCreativeFinancing ? 'text-purple-700' : 'text-blue-700'
              }`}>
                {purchaseMethods[showCreativeFinancing ? 'creative' : 'traditional']
                  .find(m => m.id === selectedPurchaseMethod)?.description}
              </p>
            </div>
          )}
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