// app/compliance/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon, ShoppingCartIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

// --- Type Definitions ---
type ServiceType = 'personalCare' | 'nursing';
type ViewType = 'intro' | 'info' | 'form';

interface CheckState {
  hasCheck: 'yes' | 'no' | null;
  docId?: string;
  expiryDate?: string;
}

type AllChecksState = Record<string, CheckState>;

// --- Constants & Animation Variants ---
const PERSONAL_CARE_CHECKS = ['National Police Check', 'Photo ID', 'First Aid', 'CPR', 'Manual handling'];
const NURSING_CHECKS = ['National Police Check', 'Photo ID', 'APHRA', 'CPR'];
const CHECK_DATA = {
    personalCare: { name: 'Personal Care Worker', checks: PERSONAL_CARE_CHECKS },
    nursing: { name: 'Nursing', checks: NURSING_CHECKS },
};

const containerVariants: Variants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.3, ease: 'easeIn' } },
};

// --- Main Component ---
export default function CompliancePage() {
  const [view, setView] = React.useState<ViewType>('intro');
  const [infoScreenType, setInfoScreenType] = React.useState<ServiceType>('personalCare');
  const [serviceType, setServiceType] = React.useState<ServiceType>('personalCare');
  const [checks, setChecks] = React.useState<AllChecksState>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [cart, setCart] = React.useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  const currentChecksList = React.useMemo(() => CHECK_DATA[serviceType].checks, [serviceType]);
  const serviceTypeName = React.useMemo(() => CHECK_DATA[serviceType].name, [serviceType]);
  
  // --- Event Handlers ---
  const handleSelectionChange = (checkName: string, value: 'yes' | 'no') => {
    setChecks(prev => ({ ...prev, [checkName]: { ...prev[checkName], hasCheck: value } }));
    if (value === 'no') { setCart(prevCart => prevCart.includes(checkName) ? prevCart : [...prevCart, checkName]); } 
    else { setCart(prevCart => prevCart.filter(item => item !== checkName)); }
  };

  const removeFromCart = (checkName: string) => {
    setCart(prevCart => prevCart.filter(item => item !== checkName));
    setChecks(prev => ({ ...prev, [checkName]: { ...prev[checkName], hasCheck: null } }));
  };

  const handleInputChange = (checkName: string, field: 'docId' | 'expiryDate', value: string) => {
    setChecks(prev => ({ ...prev, [checkName]: { ...prev[checkName], hasCheck: 'yes', [field]: value } }));
  };

  const handleSubmit = () => {
    const allAnswered = currentChecksList.every(check => checks[check]?.hasCheck);
    if (allAnswered) { setIsSubmitted(true); } 
    else { alert('Please complete all the required checks before submitting.'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col items-center justify-center p-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'intro' && (
          <motion.div key="intro" className="w-full max-w-2xl" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <IntroView onNext={() => setView('info')} />
          </motion.div>
        )}

        {view === 'info' && (
          <motion.div key="info" className="w-full max-w-2xl" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <InfoView type={infoScreenType} onToggle={setInfoScreenType} onProceed={() => { setServiceType(infoScreenType); setView('form'); }} />
          </motion.div>
        )}

        {view === 'form' && !isSubmitted && (
          <motion.div key="form" className="w-full max-w-5xl" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
            <FormView 
              serviceType={serviceType}
              onServiceTypeChange={(type: ServiceType) => { setServiceType(type); setIsSubmitted(false); setChecks({}); setCart([]); }}
              serviceTypeName={serviceTypeName}
              checksList={currentChecksList}
              checksState={checks}
              onSelectionChange={handleSelectionChange}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          </motion.div>
        )}

        {isSubmitted && (
            <motion.div key="submitted" className="w-full" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                <SubmissionSuccessScreen serviceType={serviceTypeName} submittedChecks={checks} allChecksList={currentChecksList} />
            </motion.div>
        )}
      </AnimatePresence>

      <CartIcon cartCount={cart.length} onClick={() => setIsCartOpen(true)} />
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} onRemove={removeFromCart} />
    </div>
  );
}

// --- IntroView Component ---
const IntroView = ({ onNext }: { onNext: () => void }) => {
    const listVariants = { visible: { transition: { staggerChildren: 0.2 } }, hidden: {} };
    const itemVariants = { visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }, hidden: { opacity: 0, y: 20 } };
    return (
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-gray-200 w-full text-center md:text-left">
            <p className="text-sm text-gray-500 mb-2">Step 1 of 3</p>
            <motion.h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>Let's Get Started</motion.h1>
            <motion.div className="space-y-4 text-gray-600 md:text-lg" variants={listVariants} initial="hidden" animate="visible">
                <motion.p variants={itemVariants}>To ensure the highest standards of safety and trust for everyone in our community, we require a few standard compliance checks.</motion.p>
                <motion.p variants={itemVariants}>This process helps us verify your qualifications and background, ensuring a secure environment for everyone involved.</motion.p>
            </motion.div>
            <div className="mt-10 flex justify-center md:justify-start">
                <motion.button onClick={onNext} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Next</motion.button>
            </div>
        </div>
    );
};

// --- InfoView Component ---
const InfoView: React.FC<{type: ServiceType; onToggle: (type: ServiceType) => void; onProceed: () => void;}> = ({ type, onToggle, onProceed }) => {
    const { name, checks } = CHECK_DATA[type];
    const otherType: ServiceType = type === 'personalCare' ? 'nursing' : 'personalCare';
    return (
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-gray-200 w-full">
            <p className="text-sm text-gray-500 text-center">Step 2 of 3</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mt-1">Required Checks</h2>
            <div className="text-center mt-8 mb-8"><p className="text-gray-600">For the role of:</p><h3 className="text-2xl md:text-3xl font-semibold text-blue-600">{name}</h3></div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 space-y-4">{checks.map(check => (<div key={check} className="flex items-center text-gray-800 text-lg"><CheckCircleIcon className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" /><span>{check}</span></div>))}</div>
            <div className="flex justify-between items-center mt-10">
                <motion.button onClick={() => onToggle(otherType)} className="p-2 text-gray-500 hover:text-blue-600" title={`View ${CHECK_DATA[otherType].name} checks`} whileTap={{ scale: 0.9 }}><ArrowLeftIcon className="w-6 h-6"/></motion.button>
                <motion.button onClick={onProceed} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Start My Compliance Check</motion.button>
                <motion.button onClick={() => onToggle(otherType)} className="p-2 text-gray-500 hover:text-blue-600" title={`View ${CHECK_DATA[otherType].name} checks`} whileTap={{ scale: 0.9 }}><ArrowRightIcon className="w-6 h-6"/></motion.button>
            </div>
        </div>
    );
};

// --- FormView Props Interface ---
interface FormViewProps {
  serviceType: ServiceType;
  onServiceTypeChange: (type: ServiceType) => void;
  serviceTypeName: string;
  checksList: string[];
  checksState: AllChecksState;
  onSelectionChange: (checkName: string, value: 'yes' | 'no') => void;
  onInputChange: (checkName: string, field: 'docId' | 'expiryDate', value: string) => void;
  onSubmit: () => void;
}

// --- FormView Component ---
const FormView: React.FC<FormViewProps> = ({ serviceType, onServiceTypeChange, serviceTypeName, checksList, checksState, onSelectionChange, onInputChange, onSubmit }) => (
    <>
        <div className="flex rounded-md shadow-sm mb-6 w-full">
            <span className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-l-md font-semibold text-sm sm:text-base border border-r-0 border-gray-300 flex items-center whitespace-nowrap">Your Selected Service Type</span>
            <button onClick={() => onServiceTypeChange('personalCare')} className={`w-full px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base text-center transition-colors duration-200 ${serviceType === 'personalCare' ? 'bg-orange-500 text-white shadow-inner' : 'bg-white text-gray-800 hover:bg-gray-50'}`}>Personal Care Worker</button>
            <button onClick={() => onServiceTypeChange('nursing')} className={`w-full px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base text-center transition-colors duration-200 rounded-r-md ${serviceType === 'nursing' ? 'bg-orange-500 text-white shadow-inner' : 'bg-white text-gray-800 hover:bg-gray-50'}`}>Nursing</button>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} className="bg-blue-600 text-white flex items-center justify-center rounded-xl p-10 min-h-[250px]"><h2 className="text-4xl font-bold text-center">{serviceTypeName}</h2></motion.div>
                <div className="space-y-5">
                    <p className="text-sm text-gray-700 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">Please select if you already have these checks completed. If no, we will add them to your cart to be initiated.</p>
                    {checksList.map((checkName: string) => (<CheckItem key={checkName} name={checkName} state={checksState[checkName] || { hasCheck: null }} onSelectionChange={onSelectionChange} onInputChange={onInputChange} />))}
                </div>
            </motion.div>
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <motion.button onClick={onSubmit} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Submit</motion.button>
            </div>
        </div>
    </>
);

// --- Cart Components ---
const CartIcon = ({ cartCount, onClick }: { cartCount: number, onClick: () => void }) => (
    <AnimatePresence>
        {cartCount > 0 && (
            <motion.button onClick={onClick} className="fixed bottom-8 right-8 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50" initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 50 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ShoppingCartIcon className="w-7 h-7" /><span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>
            </motion.button>
        )}
    </AnimatePresence>
);

const CartModal = ({ isOpen, onClose, cartItems, onRemove }: { isOpen: boolean, onClose: () => void, cartItems: string[], onRemove: (item: string) => void }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                <motion.div className="bg-white rounded-xl shadow-2xl w-full max-w-md" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800">Checks to Initiate</h2><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><XMarkIcon className="w-6 h-6" /></button></div>
                    <div className="p-6">
                        {cartItems.length > 0 ? (<ul className="space-y-3">{cartItems.map(item => (<motion.li key={item} layout className="flex justify-between items-center bg-gray-50 p-3 rounded-md"><span className="text-gray-700">{item}</span><button onClick={() => onRemove(item)} className="p-1 text-gray-400 hover:text-red-500"><XMarkIcon className="w-5 h-5" /></button></motion.li>))}</ul>) : (<p className="text-center text-gray-500">Your cart is empty.</p>)}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- CheckItem Component ---
const CheckItem: React.FC<{name: string; state: CheckState; onSelectionChange: (name: string, value: 'yes' | 'no') => void; onInputChange: (name: string, field: 'docId' | 'expiryDate', value: string) => void;}> = ({ name, state, onSelectionChange, onInputChange }) => {
  const needsExpiry = name !== 'Photo ID' && name !== 'Manual handling';
  return (
    <motion.div className="bg-gray-50 p-4 rounded-lg border border-gray-200" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} layout>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center cursor-pointer">
            <input type="radio" name={name} value="yes" checked={state.hasCheck === 'yes'} onChange={() => onSelectionChange(name, 'yes')} className="sr-only" /><span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${state.hasCheck === 'yes' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>{state.hasCheck === 'yes' && <div className="w-2 h-2 bg-white rounded-full"></div>}</span><span className={`ml-2 text-sm transition-colors ${state.hasCheck === 'yes' ? 'font-semibold text-black' : 'font-medium text-gray-600'}`}>Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="radio" name={name} value="no" checked={state.hasCheck === 'no'} onChange={() => onSelectionChange(name, 'no')} className="sr-only" /><span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${state.hasCheck === 'no' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>{state.hasCheck === 'no' && <div className="w-2 h-2 bg-white rounded-full"></div>}</span><span className={`ml-2 text-sm transition-colors ${state.hasCheck === 'no' ? 'font-semibold text-black' : 'font-medium text-gray-600'}`}>No</span>
          </label>
        </div>
      </div>
      <AnimatePresence>
        {state.hasCheck === 'yes' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                    <div><label htmlFor={`${name}-docId`} className="block text-xs font-medium text-gray-600 mb-1">Document/Reference ID</label><input type="text" id={`${name}-docId`} value={state.docId || ''} onChange={(e) => onInputChange(name, 'docId', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black" /></div>
                    {needsExpiry && (<div><label htmlFor={`${name}-expiry`} className="block text-xs font-medium text-gray-600 mb-1">Document Expiry Date</label><input type="date" id={`${name}-expiry`} value={state.expiryDate || ''} onChange={(e) => onInputChange(name, 'expiryDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black" /></div>)}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- UPDATED SubmissionSuccessScreen Component ---
const SubmissionSuccessScreen: React.FC<{serviceType: string; submittedChecks: AllChecksState; allChecksList: string[];}> = ({ serviceType, submittedChecks, allChecksList }) => {
    return (
        <div className="max-w-2xl w-full mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}>
                    <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-5">
                        <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                            <PaperAirplaneIcon className="w-8 h-8 text-white -rotate-45 mt-1" />
                        </div>
                    </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800">Submission Received!</h2>
                <p className="text-gray-600 mt-3 mb-6 max-w-lg mx-auto">
                    Thank you! We will review the data you've provided and initiate the checks for the items you selected 'No'.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                    <h3 className="font-semibold mb-3 text-gray-700">Your Submitted Selections for {serviceType}:</h3>
                    <ul className="space-y-2">
                        {allChecksList.map(check => (
                            <li key={check} className="flex items-center text-gray-600">
                                <CheckCircleIcon className={`w-5 h-5 mr-2 ${submittedChecks[check]?.hasCheck === 'yes' ? 'text-green-500' : 'text-orange-500'}`}/>
                                {check}
                                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${submittedChecks[check]?.hasCheck === 'yes' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {submittedChecks[check]?.hasCheck === 'yes' ? 'Provided' : 'To Be Initiated'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
                    <p>Once your profile is verified for all the checks, you can see the status in this Compliance Tab.</p>
                    <p>Have any queries? Contact us at <a href="mailto:someemail@email.com" className="text-blue-600 hover:underline">someemail@email.com</a> or call us on +61 123 456 789.</p>
                </div>
            </div>
        </div>
    );
};