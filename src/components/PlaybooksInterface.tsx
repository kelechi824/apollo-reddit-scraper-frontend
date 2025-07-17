import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, AlertCircle, Clock, CheckCircle, Wand2, ChevronDown, FileText, Sparkles, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface PlaybooksInterfaceProps {
  apiUrl: string;
  onPlaybookGenerate: (jobTitle: string, markdownData: string) => void;
}

const PlaybooksInterface: React.FC<PlaybooksInterfaceProps> = ({ apiUrl, onPlaybookGenerate }) => {
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [jobTitleSearch, setJobTitleSearch] = useState<string>('');
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState<boolean>(false);
  const [rawData, setRawData] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStage, setConversionStage] = useState<string>('');
  const [markdownData, setMarkdownData] = useState<string>('');
  const [hasConversionCompleted, setHasConversionCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | ''>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  
  const jobTitleDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Comprehensive job titles list from CSV - automatically sorted alphabetically
  const jobTitles = [
    'Accommodations Director', 'Account Client Partner', 'Account Coordinator', 'Account Development Manager', 'Account Development Representative', 'Account Director', 'Account Executive', 'Account Executive - Business Development', 'Account Executive Assistant', 'Account Management Intern', 'Account Management Manager', 'Account Management Supervisor', 'Account Manager', 'Account Manager Supervisor', 'Account Representative', 'Account Sales Manager', 'Account Supervisor', 'Account receivable Manager', 'Accountant', 'Accounting', 'Accounting Analyst', 'Accounting Assistant', 'Accounting Associate', 'Accounting Clerk', 'Accounting Clerk Assistant', 'Accounting Clerk Specialist', 'Accounting Controller', 'Accounting Director', 'Accounting Intern', 'Accounting Manager', 'Accounting Specialist', 'Accounting Supervisor', 'Accounts Assistant', 'Accounts Director', 'Accounts Management Director', 'Accounts Payable', 'Accounts Payable Clerk', 'Accounts Payable Coordinator', 'Accounts Payable Manager', 'Accounts Payable Specialist', 'Accounts Payable Supervisor', 'Accounts Receivable', 'Accounts Receivable Analyst', 'Accounts Receivable Assistant', 'Accounts Receivable Clerk', 'Accounts Receivable Manager', 'Accounts Receivable Specialist', 'Accounts Receivable Supervisor', 'Accounts Supervisor', 'Acquisitions Analyst', 'Adjunct Faculty', 'Adjunct Instructor', 'Adjunct Professor', 'Admin', 'Admin Services Director', 'Administration', 'Administration Director', 'Administration Executive Vice President', 'Administration Manager', 'Administration Vice President', 'Administrative Assistant', 'Administrative Coordinator', 'Administrative Director', 'Administrative Manager', 'Administrative Operations Director', 'Administrative Program Coordinator', 'Administrative Project Manager', 'Administrative Sales Assistant', 'Administrative Services', 'Administrative Services Director', 'Administrative Specialist', 'Administrative Support Specialist', 'Administrator', 'Admissions Assistant', 'Admissions Assistant Director', 'Admissions Associate Director', 'Admissions Coordinator', 'Admissions Counselor', 'Admissions Director', 'Advanced Tax Analyst', 'Advertising Analyst', 'Advertising Buyer', 'Advertising Consultant', 'Advertising Director', 'Advertising Manager', 'Advertising Media Planner', 'Advisor', 'Agent', 'Agreements Manager', 'AI Engineer', 'Ambassador', 'Analysis Director', 'Analysis Manager', 'Analyst', 'Analyst Intern', 'Analyst of Business Processes', 'Analyst of Data', 'Analytical Chemist', 'Analytics Manager', 'Analytics Senior Director', 'Android Developer', 'Angel Investor', 'App Engineer', 'Application Analyst', 'Application Developer', 'Application Engineer', 'Application Specialist', 'Applications Engineer', 'Architect', 'Architect for Projects', 'Architectural Designer', 'Architectural Project Manager', 'Architectural Solutions Specialist', 'Architectural Visualizer', 'Area Manager', 'Area Sales Manager', 'Art Director', 'Art Studio Manager', 'Artist', 'Artistic Director', 'Artistic Manager', 'Artistic Partner', 'Artistic Producer', 'Asset Management Supervisor', 'Asset Manager', 'Asset Portfolio Manager', 'Assets Manager', 'Assistant', 'Assistant Account Executive', 'Assistant Account Manager', 'Assistant Accountant', 'Assistant Accounts Payable Manager', 'Assistant Admissions Director', 'Assistant Audit Manager', 'Assistant Board of Directors', 'Assistant Branch Manager', 'Assistant Brand Manager', 'Assistant Buyer', 'Assistant Coach', 'Assistant Controller', 'Assistant Director', 'Assistant Director of Admissions', 'Assistant Director of Construction', 'Assistant Director of Finance', 'Assistant Director of Human Resources', 'Assistant Director of Property Management', 'Assistant Director of Real Estate', 'Assistant Director of Sales', 'Assistant Engineering Manager', 'Assistant Export Manager', 'Assistant Facility Manager', 'Assistant Finance Director', 'Assistant Finance Manager', 'Assistant Financial Analyst', 'Assistant Front Office Manager', 'Assistant General Counsel', 'Assistant General Manager', 'Assistant HR Director', 'Assistant Head Coach', 'Assistant Head of School', 'Assistant Hotel Manager', 'Assistant Human Resources Manager', 'Assistant Information Technology Manager', 'Assistant Legal Counsel', 'Assistant Manager', 'Assistant Manager - Sales', 'Assistant Manager of Operations', 'Assistant Marketing Manager', 'Assistant Media Supervisor', 'Assistant Merchandising Manager', 'Assistant Office Manager', 'Assistant Operations Manager', 'Assistant Plant Controller', 'Assistant Principal', 'Assistant Product Manager', 'Assistant Production Coordinator', 'Assistant Professor', 'Assistant Project Manager', 'Assistant Property Manager', 'Assistant Real Estate Manager', 'Assistant Restaurant Manager', 'Assistant Retail Manager', 'Assistant Sales Manager', 'Assistant Site Manager', 'Assistant State Manager', 'Assistant Store Manager', 'Assistant Superintendent', 'Assistant Treasury Manager', 'Assistant VP', 'Assistant Vice Chairman', 'Assistant Vice President', 'Assistant Vice President of Business Development', 'Assistant Vice President of Finance', 'Assistant to the Account Executive', 'Assistant to the Director', 'Assistant to the Executive', 'Associate', 'Associate Account Executive', 'Associate Account Manager', 'Associate Accountant', 'Associate Attorney', 'Associate Auditor', 'Associate Brand Manager', 'Associate Broker', 'Associate Buyer', 'Associate Clinical Research Associate', 'Associate Coach', 'Associate Consultant', 'Associate Controller', 'Associate Developer', 'Associate Director', 'Associate Director of Admissions', 'Associate Director of Finance', 'Associate Director of Human Resources', 'Associate Editorial Director', 'Associate Equity Research Analyst', 'Associate Finance Manager', 'Associate Financial Advisor', 'Associate General Counsel', 'Associate IT Manager', 'Associate Investment Analyst', 'Associate Lawyer', 'Associate Legal Counsel', 'Associate Manager', 'Associate Marketing Manager', 'Associate Partner', 'Associate Pastor', 'Associate Principal', 'Associate Producer', 'Associate Product Manager', 'Associate Professor', 'Associate Project Manager', 'Associate Regulatory Auditor', 'Associate Research Manager', 'Associate Software Developer', 'Associate Superintendent', 'Associate Trainee', 'Associate Vice President', 'Associate of Assurance', 'Associate of Operations', 'Association Manager', 'Assurance Associate', 'Assurance Director', 'Assurance Manager', 'Assurance Senior', 'Assurance Services', 'Assurance Specialist', 'Athletic Coach', 'Athletic Coordinator', 'Athletic Director', 'Attorney', 'Attorney at Law', 'Audit', 'Audit Accountant', 'Audit Assistant', 'Audit Associate', 'Audit Coordinator', 'Audit Director', 'Audit Intern', 'Audit Manager', 'Audit Partner', 'Audit Senior', 'Audit Senior Associate', 'Audit Supervisor', 'Auditing', 'Auditor', 'Author', 'Authorized Distributor', 'Automation Engineer', 'Automation Specialist', 'BD Associate', 'BD Coordinator', 'BI Analyst', 'BI Director', 'Back End Web Developer', 'Bank Manager', 'Bank Teller', 'Banking Specialist', 'Bar Manager', 'Barista', 'Barista Server', 'Bartender', 'Benefits Administration Manager', 'Benefits Analyst', 'Benefits Manager', 'Bestselling Author', 'Bid Manager', 'Big Data Engineer', 'Billing Administrator', 'Billing Manager', 'Billing Specialist', 'Billing Supervisor', 'Biochemist', 'Biotechnology Laboratory Manager', 'Board Chairman', 'Board Chairperson', 'Board Director', 'Board Governance Director', 'Board Member', 'Board Member Director', 'Board Operations Director', 'Board President', 'Board Secretary', 'Board Trustee', 'Board of Directors', 'Board of Directors Chair', 'Board of Directors Member', 'Bookkeeper', 'Bookkeeping', 'Bookkeeping Manager', 'Branch Manager', 'Branch Operations Manager', 'Brand Ambassador', 'Brand Consultant', 'Brand Coordinator', 'Brand Director', 'Brand Manager', 'Brand Marketing Manager', 'Brand Marketing Officer', 'Brand Marketing Specialist', 'Brand Partner', 'Brand Representative', 'Brand Strategist', 'Branding Director', 'Broker', 'Broker Associate', 'Broker Owner Operator', 'Brokerage Associate', 'Brokerage Manager', 'Budget Analyst', 'Budget Estimator', 'Budget Manager', 'Building Maintenance Director', 'Building Maintenance Manager', 'Building Maintenance Supervisor', 'Building Manager', 'Building Services Director', 'Building Surveyor', 'Business Account Manager', 'Business Administrator', 'Business Analysis Director', 'Business Analysis Lead', 'Business Analysis Manager', 'Business Analyst', 'Business Analytics Specialist', 'Business Community Manager', 'Business Consultant', 'Business Controller', 'Business Data Analyst', 'Business Developer', 'Business Development', 'Business Development Analyst', 'Business Development Assistant Vice President', 'Business Development Associate', 'Business Development Consultant', 'Business Development Coordinator', 'Business Development Director', 'Business Development Executive', 'Business Development Executive Vice President', 'Business Development Intern', 'Business Development Manager', 'Business Development Officer', 'Business Development Partner', 'Business Development Representative', 'Business Development Senior Director', 'Business Development Senior Vice President', 'Business Development Specialist', 'Business Development Vice President', 'Business Director', 'Business Division Director', 'Business Engagement Manager', 'Business Founder', 'Business Growth Manager', 'Business Head', 'Business Intelligence Analyst', 'Business Intelligence Manager', 'Business Management Associate', 'Business Manager', 'Business Office Manager', 'Business Operations Analyst', 'Business Operations Director', 'Business Operations Manager', 'Business Operations Officer', 'Business Operations Supervisor', 'Business Owner', 'Business Partner', 'Business Planning Manager', 'Business Process Analyst', 'Business Process Manager', 'Business Relationship Manager', 'Business Solutions Consultant', 'Business Strategist', 'Business Strategy Consultant', 'Business Strategy Director', 'Business Strategy Manager', 'Business System Analyst', 'Business Systems Analyst', 'Business Unit Director', 'Business Unit Manager', 'Buyer', 'Buyer Manager', 'Buying Assistant', 'CAD Engineer', 'CBO - Chief Business Officer', 'CPA Manager', 'CPA Supervisor', 'CRM Manager', 'CTO - Chief Technical Officer', 'Campaign Manager', 'Campus Ambassador', 'Care Coordinator', 'Career Coach', 'Case Manager', 'Cashier', 'Category Development Manager', 'Category Management Lead', 'Category Manager', 'Catering Manager', 'Center Director', 'Center Manager', 'Certified Accountant', 'Certified Financial Planner', 'Certified Personal Trainer', 'Certified Public Accountant', 'Certified Public Accountant specializing in Taxation', 'Certified Registered Nurse', 'Chair of Board of Directors', 'Chair of the Board', 'Chairman', 'Chairman of The Board', 'Chairman of the Directors', 'Chairman of the Executive Board', 'Chairperson', 'Chairperson of the Board', 'Channel Manager', 'Charity Fundraiser', 'Chartered Accountant', 'Chauffeur', 'Chef', 'Chef de Cuisine', 'Chemical Process Engineer', 'Chemist', 'Chief', 'Chief Accountant', 'Chief Accounting Officer', 'Chief Administrative Officer', 'Chief Architects', 'Chief Attorney', 'Chief Audit Executive', 'Chief Board Member', 'Chief Business Development Officer', 'Chief Business Officer', 'Chief Clinical Officer', 'Chief Commercial Officer', 'Chief Communications Officer', 'Chief Compliance Officer', 'Chief Counsel', 'Chief Creative Officer', 'Chief Credit Officer', 'Chief Data Officer', 'Chief Development Officer', 'Chief Digital Marketing Officer', 'Chief Digital Officer', 'Chief Editor', 'Chief Electrical Engineer', 'Chief Engineer', 'Chief Engineering Officer', 'Chief Escrow Officers', 'Chief Estimator', 'Chief Executive', 'Chief Executive Officer', 'Chief Finance Officer', 'Chief Financial Accountant', 'Chief Financial Officer', 'Chief Financial Services Officer', 'Chief General Director', 'Chief Growth Officer', 'Chief HR Officer', 'Chief Human Resources Officer', 'Chief Information Officer', 'Chief Information Security Officer', 'Chief Information Technology Officer', 'Chief Innovation Officer', 'Chief Investment Officer', 'Chief Learning Officer', 'Chief Leasing Officer', 'Chief Legal Officer', 'Chief Lending Officer', 'Chief Maintenance Officer', 'Chief Manager', 'Chief Manufacturing Officer', 'Chief Marketing Officer', 'Chief Mechanical Engineer', 'Chief Medical Director', 'Chief Medical Officer', 'Chief Nurse Executive', 'Chief Nursing Officer', 'Chief Officer of Development', 'Chief Operating Officer', 'Chief Operations Officer', 'Chief People Officer', 'Chief Portfolio Officer', 'Chief Procurement Officer', 'Chief Product Officer', 'Chief Research Officer', 'Chief Revenue Officer', 'Chief Risk Officer', 'Chief Sales Officer', 'Chief Science Officer', 'Chief Scientific Officer', 'Chief Security Officer', 'Chief Strategist', 'Chief Strategy Officer', 'Chief Tech Officer', 'Chief Technical Officer', 'Chief Technology Officer', 'Chief Underwriting Officer', 'Chief Vice President', 'Chief of Department', 'Chief of Staff', 'Chiropractor', 'City Administrator', 'City Director', 'City Executive', 'City Manager', 'Civil Engineer', 'Civil Project Manager', 'Claims Manager', 'Claims Operations Manager', 'Claims Supervisor', 'Claims Team Leader', 'Classroom Assistant', 'Client Account Executive', 'Client Account Manager', 'Client Advisor', 'Client Care Representative', 'Client Delivery Manager', 'Client Development Director', 'Client Director', 'Client Engagement Manager', 'Client Executive', 'Client Manager', 'Client Partner', 'Client Partner Manager', 'Client Relations Director', 'Client Relations Executive', 'Client Relations Manager', 'Client Relations Representative', 'Client Relationship Manager', 'Client Service Director', 'Client Service Manager', 'Client Service Specialist', 'Client Service Supervisor', 'Client Services Advisor', 'Client Services Coordinator', 'Client Services Director', 'Client Services Executive', 'Client Services Manager', 'Client Services Supervisor', 'Client Services Vice President', 'Client Success Director', 'Client Success Executive', 'Client Success Manager', 'Client Support Manager', 'Clinic Director', 'Clinical Application Specialist', 'Clinical Case Manager', 'Clinical Coordinator', 'Clinical Director', 'Clinical Fellow', 'Clinical Laboratory Director', 'Clinical Laboratory Manager', 'Clinical Manager', 'Clinical Nurse', 'Clinical Nurse Manager', 'Clinical Operations', 'Clinical Operations Director', 'Clinical Operations Manager', 'Clinical Operations Supervisor', 'Clinical Pharmacist', 'Clinical Pharmacy Manager', 'Clinical Practice Manager', 'Clinical Principal Scientist', 'Clinical Program Manager', 'Clinical Project Manager', 'Clinical Research Associate', 'Clinical Research Coordinator', 'Clinical Research Manager', 'Clinical Sales Representative', 'Clinical Services Director', 'Clinical Trial Coordinator', 'Cloud Solutions Architect', 'Co-Founder', 'Co-founder', 'Co-owner', 'Coach', 'Cocktail Bartender', 'Coffee Barista', 'Colleague', 'Collections Specialist', 'Commercial Banking Vice President', 'Commercial Director', 'Commercial Finance Vice President', 'Commercial Interior Designer', 'Commercial Lending VP', 'Commercial Loan Officer', 'Commercial Manager', 'Commercial Property Manager', 'Commercial Real Estate Broker', 'Commercial Realtor', 'Commercial Underwriter', 'Committee Chair', 'Committee Member', 'Committee Participant', 'Committee Representative', 'Commodity Manager', 'Communication Manager', 'Communication Technology Manager', 'Communications Consultant', 'Communications Coordinator', 'Communications Director', 'Communications Intern', 'Communications Manager', 'Communications Officer', 'Communications Specialist', 'Community Association Manager', 'Community Development Manager', 'Community Development Officer', 'Community Director', 'Community Engagement Director', 'Community Engagement Manager', 'Community Engagement Specialist', 'Community Manager', 'Community Outreach Coordinator', 'Community Outreach Director', 'Community Pharmacist', 'Community Property Manager', 'Company Creator', 'Company Director', 'Company President', 'Company Secretary', 'Compensation Analyst', 'Compensation Consultant', 'Compliance Analyst', 'Compliance Director', 'Compliance Manager', 'Compliance Officer', 'Compliance Specialist', 'Computer Programmer', 'Computer Specialist', 'Computer Systems Manager', 'Construction Assistant Director', 'Construction Contractor', 'Construction Director', 'Construction Engineer', 'Construction Estimator', 'Construction Executive Vice President', 'Construction Management Director', 'Construction Manager', 'Construction Operations Director', 'Construction Project Controller', 'Construction Project Coordinator', 'Construction Project Manager', 'Construction Senior Director', 'Construction Senior Vice President', 'Construction Site Supervisor', 'Construction Superintendent', 'Construction Supervisor', 'Construction Surveyor', 'Construction Vice President', 'Consultant', 'Consultant Contractor', 'Consultant I', 'Consultant for Implementation', 'Consultant in Implementation', 'Consulting Director', 'Consulting Freelancer', 'Consulting Manager', 'Consulting Professional', 'Content', 'Content Creator', 'Content Developer', 'Content Director', 'Content Editor', 'Content Manager', 'Content Marketing Manager', 'Content Marketing Strategist', 'Content Operations Manager', 'Content Producer', 'Content Strategist', 'Content Strategy Director', 'Content Strategy Manager', 'Content Writer', 'Continuous Improvement Specialist', 'Contract Administrator', 'Contract Analyst', 'Contract Manager', 'Contract Specialist', 'Contract Worker', 'Contractor', 'Contracts Manager', 'Contributing Author', 'Contributing Member', 'Contributing Writer', 'Contributor', 'Controller', 'Controller Assistant', 'Controller Manager', 'Controller Officer', 'Controller of Finance', 'Coordinator', 'Coordinator of Business Development', 'Coordinator of Operations', 'Copy Editor', 'Copywriter', 'Copywriting Manager', 'Corporate Account Director', 'Corporate Account Manager', 'Corporate Business Development Manager', 'Corporate Chief Accountant', 'Corporate Client Director', 'Corporate Communications', 'Corporate Communications Consultant', 'Corporate Communications Director', 'Corporate Communications Lead', 'Corporate Communications Manager', 'Corporate Communications Specialist', 'Corporate Compliance Manager', 'Corporate Controller', 'Corporate Counsel', 'Corporate Development Associate', 'Corporate Development Consultant', 'Corporate Development Executive', 'Corporate Director of Sales', 'Corporate Event Planner', 'Corporate Events Manager', 'Corporate Investor Relations', 'Corporate Lawyer', 'Corporate Legal Advisor', 'Corporate Legal Counsel', 'Corporate Planner', 'Corporate Recruiter', 'Corporate Relationship Manager', 'Corporate Secretary', 'Corporate Social Responsibility Manager', 'Corporate Trustee', 'Correspondent', 'Cost Estimator', 'Counsel', 'Counselor', 'Country Manager', 'Creative Design Director', 'Creative Design Manager', 'Creative Designer', 'Creative Director', 'Creative Director Owner', 'Creative Lead', 'Creative Manager', 'Creative Partner', 'Creative Photographer', 'Creative Producer', 'Creative Services Director', 'Creative Services Manager', 'Creative Services Team Lead', 'Creative Studio Manager', 'Creative Video Producer', 'Creative Writer', 'Creativity Director', 'Credit Analyst', 'Credit Control Manager', 'Credit Controller', 'Credit Manager', 'Credit Risk Analyst', 'Credit Risk Manager', 'Credit Risk Officer', 'Culinary Chef', 'Culinary Director', 'Cultural Ambassador', 'Curriculum Development Director', 'Customer Account Manager', 'Customer Account Representative', 'Customer Advisor', 'Customer Care Manager', 'Customer Client Partner', 'Customer Engagement Manager', 'Customer Experience Coordinator', 'Customer Experience Director', 'Customer Experience Manager', 'Customer Manager', 'Customer Relations Director', 'Customer Relations Manager', 'Customer Relations Senior Vice President', 'Customer Relations Specialist', 'Customer Relationship Manager', 'Customer Sales Manager', 'Customer Sales Support', 'Customer Service Associate', 'Customer Service Director', 'Customer Service Engineer', 'Customer Service Manager', 'Customer Service Representative', 'Customer Service Specialist', 'Customer Service Supervisor', 'Customer Success Director', 'Customer Success Engineer', 'Customer Success Manager', 'Customer Support Director', 'Customer Support Engineer', 'Customer Support Manager', 'Customer Support Specialist', 'Customer Support Supervisor', 'Cyber Security Consultant', 'Cybersecurity Analyst', 'Data Analysis Director', 'Data Analyst', 'Data Analytics Manager', 'Data Engineer', 'Data Science Analyst', 'Data Science Manager', 'Data Scientist', 'Database Administrator', 'Database Analyst', 'Database Developer', 'Database Engineer', 'Database Manager', 'Dean', 'Dean of Admissions', 'Delivery Driver', 'Delivery Manager', 'Demand Planner', 'Demand Planning Manager', 'Dental Practice Manager', 'Dental Practice Owner', 'Dental Surgeon', 'Dentist', 'Department Director', 'Department Head', 'Department Manager', 'Departments Director', 'Deployment Manager', 'Deputy Chairman', 'Deputy Controller', 'Deputy Director', 'Deputy Director of Finance', 'Deputy Director of Human Resources', 'Deputy Finance Manager', 'Deputy General Counsel', 'Deputy General Manager', 'Deputy Human Resources Manager', 'Deputy IT Manager', 'Deputy Principal', 'Deputy Superintendent', 'Design Architect', 'Design Consultant', 'Design Director', 'Design Engineer', 'Design Lead', 'Design Manager', 'Design Owner', 'Design Partner', 'Design Specialist', 'Designer', 'Designer of Interiors', 'Desktop Support Technician', 'DevOps Architect', 'Developer', 'Development Adviser', 'Development Associate', 'Development Chief Officer', 'Development Coordinator', 'Development Director', 'Development Engineer', 'Development Executive Vice President', 'Development Lead', 'Development Manager', 'Development Officer', 'Development Operations Engineer', 'Development Senior Director', 'Development Senior Vice President', 'Development Specialist', 'Development Vice President', 'Devops Engineer', 'Digital Account manager', 'Digital Advertising Manager', 'Digital Commerce Manager', 'Digital Communications Specialist', 'Digital Content Creator', 'Digital Content Manager', 'Digital Content Strategist', 'Digital Designer', 'Digital Director', 'Digital Manager', 'Digital Marketing Analyst', 'Digital Marketing Assistant', 'Digital Marketing Associate', 'Digital Marketing Consultant', 'Digital Marketing Coordinator', 'Digital Marketing Director', 'Digital Marketing Executive', 'Digital Marketing Intern', 'Digital Marketing Manager', 'Digital Marketing Officer', 'Digital Marketing Professional', 'Digital Marketing Representative', 'Digital Marketing Specialist', 'Digital Marketing Strategist', 'Digital Media Buyer', 'Digital Media Manager', 'Digital Media Planner', 'Digital Media Specialist', 'Digital Producer', 'Digital Project Manager', 'Digital Publisher', 'Digital Sales Manager', 'Digital Strategist', 'Digital Strategy Director', 'Digital Strategy Manager', 'Digital Technology Manager', 'Digital Transformation Lead', 'Diplomatic Ambassador', 'Director', 'Director General', 'Director at Startup', 'Director of Accounting', 'Director of Accounts', 'Director of Admin Services', 'Director of Administration', 'Director of Administrative Operations', 'Director of Admissions', 'Director of Advertising', 'Director of Analysis', 'Director of Board Member', 'Director of Board Operations', 'Director of Branding', 'Director of Building Services', 'Director of Business Development', 'Director of Business Operations', 'Director of Client Relations', 'Director of Client Services', 'Director of Clinical Operations', 'Director of Clinical Services', 'Director of Communications', 'Director of Community Engagement', 'Director of Compliance', 'Director of Construction', 'Director of Construction Management', 'Director of Construction Operations', 'Director of Content', 'Director of Content Strategy', 'Director of Creativity', 'Director of Curriculum Development', 'Director of Customer Service', 'Director of Customer Success', 'Director of Data Analysis', 'Director of Department', 'Director of Departments', 'Director of Design', 'Director of Development', 'Director of Digital Marketing', 'Director of Digital Strategy', 'Director of Education', 'Director of Engineering', 'Director of Events', 'Director of External Financial Reporting', 'Director of Facilities', 'Director of Facilities Management', 'Director of Facility Management', 'Director of Finance', 'Director of Financial Planning', 'Director of Financial Reporting', 'Director of Financial Services', 'Director of Global Sales', 'Director of Golf Operations', 'Director of Guest Services', 'Director of HR', 'Director of Healthcare Services', 'Director of Human Resoruces', 'Director of Human Resources', 'Director of IT Operations', 'Director of Information Technology', 'Director of Instruction', 'Director of Internal Audit', 'Director of Investment', 'Director of Investments', 'Director of Laboratory Services', 'Director of Learning', 'Director of Leasing', 'Director of Logistics', 'Director of Maintenance', 'Director of Manufacturing', 'Director of Marketing', 'Director of Medical Affairs', 'Director of Membership', 'Director of Nursing', 'Director of Operations', 'Director of Partnerships', 'Director of Patient Care Services', 'Director of Pharmacy', 'Director of Planning', 'Director of Procurement', 'Director of Product', 'Director of Product Development', 'Director of Product Management', 'Director of Production', 'Director of Professional Services', 'Director of Program', 'Director of Program Management', 'Director of Programs', 'Director of Project', 'Director of Project Management', 'Director of Projects', 'Director of Property Management', 'Director of Public Relations', 'Director of Purchasing', 'Director of Quality', 'Director of Quality Assurance', 'Director of Quality Control', 'Director of Real Estate', 'Director of Recruiting', 'Director of Recruitment', 'Director of Regulatory Compliance', 'Director of Research', 'Director of Retail Operations', 'Director of Revenue', 'Director of Rooms', 'Director of Safety', 'Director of Sales', 'Director of Sales Operations', 'Director of Security', 'Director of Social Media', 'Director of Social Media Marketing', 'Director of Social Media Strategy', 'Director of Software Development', 'Director of Software Engineering', 'Director of Special Events', 'Director of Special Projects', 'Director of Store Operations', 'Director of Strategic Accounts', 'Director of Strategic Initiatives', 'Director of Strategic Planning', 'Director of Strategy', 'Director of Supply Chain', 'Director of Technical Services', 'Director of Technology', 'Director of Training', 'Director of Transportation', 'Director on Board', 'Dispatch Manager', 'Dispatch Supervisor', 'Dispatcher', 'Distribution Center Manager', 'Distribution Manager', 'Distribution Specialist', 'Distribution Supervisor', 'Distributor Partner', 'District Administrator', 'District Manager', 'Division', 'Division Director', 'Division Manager', 'Divisional Director', 'Divisional Head', 'Divisional Manager', 'Doctor of Medicine', 'Doctor of Optometry', 'Documentation Manager', 'Donor Relations Officer', 'Driver', 'Duty Manager', 'E-Business Manager', 'E-Commerce Manager', 'E-commerce Manager', 'E-commerce Project Manager', 'EHS Coordinator', 'EHS Manager', 'ESL Teacher', 'Ecommerce Manager', 'Editor', 'Editor In Chief', 'Editor in Chief', 'Editor-in-Chief', 'Editorial Director', 'Editorial Manager', 'Editorial Publisher', 'Education Administrator', 'Education Coordinator', 'Education Director', 'Educational Assistant', 'Educator', 'Electrical Engineer', 'Electrical Technician', 'Electrician', 'Electrician Apprentice', 'Email Marketing Manager', 'Employee Benefits Manager', 'Employee Engagement Manager', 'Employee Learning Manager', 'Employee Relations Advisor', 'Employee Relations Coordinator', 'Employee Relations Manager', 'Employee Relations Partner', 'Employee Relations Specialist', 'Employee Training Specialist', 'Engagement Manager', 'Engineer', 'Engineering Department Manager', 'Engineering Designer', 'Engineering Director', 'Engineering Executive Vice President', 'Engineering Manager', 'Engineering Program Manager', 'Engineering Project Manager', 'Engineering Senior Vice President', 'Engineering Solutions Manager', 'Engineering Technical Manager', 'Engineering Vice President', 'English Teacher', 'English Tutor', 'Enterprise Architect', 'Enterprise Solutions Architect', 'Entrepreneur', 'Entry Level Accountant', 'Entry Level Consultant', 'Entry Level Trainee', 'Environmental Compliance Manager', 'Environmental Engineer', 'Environmental Health Manager', 'Environmental Sustainability Manager', 'Equipment Manager', 'Equity Analyst', 'Equity Associate', 'Equity Holder', 'Equity Investment Associate', 'Equity Research Analyst', 'Equity Research Associate', 'Equity Sales Associate', 'Escrow Manager', 'Escrow Officer', 'Espresso Barista', 'Estate Management Officer', 'Estimating Coordinator', 'Estimating Manager', 'Estimator', 'Event Coordinator', 'Event Director', 'Event Manager', 'Event Marketing Manager', 'Event Operations Manager', 'Event Planner', 'Event Planning Manager', 'Event Program Coordinator', 'Event Specialist', 'Events Coordinator', 'Events Director', 'Events Manager', 'Events Senior Director', 'Executive', 'Executive Account Director', 'Executive Account Executive', 'Executive Account Manager', 'Executive Accounts Payable Manager', 'Executive Administrative Assistant', 'Executive Assistant', 'Executive Assistant Manager', 'Executive Assistant To Chief Executive Officer', 'Executive Audit Assistant', 'Executive Board Member', 'Executive Board of Directors', 'Executive Business Director', 'Executive Chairman', 'Executive Chef', 'Executive Compliance Analyst', 'Executive Director', 'Executive Director of Finance', 'Executive Director of Human Resources', 'Executive Director of Marketing', 'Executive Director of Operations', 'Executive Director of Property Management', 'Executive Director of Real Estate', 'Executive Director of Technical Services', 'Executive Editor', 'Executive Founder', 'Executive HR Director', 'Executive Human Resources Manager', 'Executive Manager', 'Executive Marketing Officer', 'Executive Media Supervisor', 'Executive Member Manager', 'Executive Officer', 'Executive Operating Officer', 'Executive Partner', 'Executive Pastor', 'Executive Personal Assistant', 'Executive President', 'Executive Producer', 'Executive Project Manager', 'Executive Recruiter', 'Executive Safety Director', 'Executive Search Consultant', 'Executive Secretary', 'Executive Secretary To Chief Executive Officer', 'Executive State Manager', 'Executive Structural Engineer', 'Executive Talent Acquisition Partner', 'Executive Talent Acquisition Specialist', 'Executive Vice President', 'Executive Vice President of Administration', 'Executive Vice President of Business Development', 'Executive Vice President of Construction', 'Executive Vice President of Development', 'Executive Vice President of Engineering', 'Executive Vice President of Finance', 'Executive Vice President of Operations', 'Executive Vice President of Sales', 'Experienced Advisor', 'Experienced Associate Consultant', 'Experienced Construction Manager', 'Experienced Loan Officer', 'Experienced Sales Rep', 'Experienced System Administrator', 'Experienced Systems Architect', 'Experienced Tax Advisor', 'Experimental Engineer', 'Export Manager', 'External Financial Reporting Director', 'Eye Doctor', 'Facilities Coordinator', 'Facilities Director', 'Facilities Management Director', 'Facilities Manager', 'Facilities Operations Director', 'Facilities Operations Manager', 'Facilities Specialist', 'Facilities Supervisor', 'Facility Director', 'Facility Maintenance Director', 'Facility Management Director', 'Facility Manager', 'Factory Manager', 'Fashion Design Consultant', 'Female Entrepreneur', 'Field Engineer', 'Field Sales Representative', 'Field Service Engineer', 'Field Service Manager', 'Field Service Technician', 'Field Superintendent', 'Field Technician', 'Film Director', 'Film Producer', 'Finance', 'Finance Analyst', 'Finance Assistant', 'Finance Assistant Director', 'Finance Assistant Manager', 'Finance Assistant Vice President', 'Finance Associate Director', 'Finance Business Partner', 'Finance Consultant', 'Finance Controller', 'Finance Deputy Director', 'Finance Director', 'Finance Executive Director', 'Finance Executive Vice President', 'Finance Head', 'Finance Intern', 'Finance Manager', 'Finance Manger', 'Finance Officer', 'Finance Planning Manager', 'Finance Pricing Manager', 'Finance Relationship Manager', 'Finance Senior Director', 'Finance Senior Vice President', 'Finance Services Manager', 'Finance Services Specialist', 'Finance Specialist', 'Finance Trainee', 'Finance Vice President', 'Financial Accountant', 'Financial Advisor', 'Financial Analyst', 'Financial Analyst Manager', 'Financial Assistant', 'Financial Associate', 'Financial Assurance Associate', 'Financial Business Partner', 'Financial Clerk', 'Financial Compliance Auditor', 'Financial Consultant', 'Financial Controller', 'Financial Intern', 'Financial Lead', 'Financial Manager', 'Financial Officer', 'Financial Operations Analyst', 'Financial Planner', 'Financial Planning Director', 'Financial Planning Manager', 'Financial Portfolio Manager', 'Financial Project Controller', 'Financial Reporting Analyst', 'Financial Reporting Director', 'Financial Reporting Manager', 'Financial Reporting Senior Director', 'Financial Representative', 'Financial Service Manager', 'Financial Services', 'Financial Services Advisor', 'Financial Services Consultant', 'Financial Services Director', 'Financial Services Professional', 'Financial Services Representative', 'Financial Specialist', 'Financial Supervisor', 'Financial Tax Specialist', 'Financial Wealth Manager', 'Financing Manager', 'First Assistant Coach', 'First Director', 'Fiscal Controller', 'Fitness Trainer', 'Fleet Maintenance Manager', 'Fleet Manager', 'Fleet Operations Manager', 'Food Service General Manager', 'Food Services Director', 'Forecasting Analyst', 'Forensic Accountant', 'Founder', 'Founding Director', 'Founding Member', 'Founding Partner', 'Franchise Owner', 'Freelance Consultant', 'Freelance Graphic Designer', 'Freelance Illustrator', 'Freelance Photographer', 'Freelance Video Producer', 'Freelance Writer', 'Freelancer', 'Front Desk Agent', 'Front Desk Clerk', 'Front Desk Manager', 'Front End Designer', 'Front End Developer', 'Front End Web Developer', 'Front Office Manager', 'Front-End Developer', 'Front-End Engineer', 'Frontend Backend Developer', 'Frontend Developer', 'Frontend Engineer', 'Fulfillment Manager', 'Full Stack Developer', 'Full Stack Engineer', 'Full Stack Java Developer', 'Full Stack Web Developer', 'Fund Accountant', 'Fund Manager', 'Fundraiser', 'Fundraising Officer', 'Fundraising Specialist', 'General Contractor', 'General Counsel', 'General Counsel Assistant', 'General Dentist', 'General Director', 'General Legal Counsel', 'General Manager', 'General Operations Manager', 'General Partner', 'General Practitioner', 'General Store Manager', 'Geotechnical Engineer', 'Global Account Director', 'Global Account Executive', 'Global Business Director', 'Global Buyer', 'Global Employee Relations Manager', 'Global Head of Marketing', 'Global Operations Analyst', 'Global Operations Specialist', 'Global Payroll Coordinator', 'Global Sales Director', 'Global Sourcing Executive', 'Global Strategic Account Executive', 'Global Strategic Account Manager', 'Golf Course Manager', 'Golf Operations Director', 'Graduate Research Assistant', 'Graphic Artist', 'Graphic Design Consultant', 'Graphic Design Manager', 'Graphic Designer', 'Green Initiatives Manager', 'Guest Relations Agent', 'Guest Services Agent', 'Guest Services Director', 'HR Administrator', 'HR Analytics Specialist', 'HR Assistant', 'HR Assistant Manager', 'HR Business Partner', 'HR Consultant', 'HR Coordinator', 'HR Data Analyst', 'HR Director', 'HR Generalist', 'HR Intern', 'HR Manager', 'HR Metrics Analyst', 'HR Operations Supervisor', 'HR Recruiter', 'HR Recruiting Manager', 'HR Recruiting Specialist', 'HR Recruitment Manager', 'HR Recruitment Specialist', 'HR Rep', 'HR Representative', 'HR Resource Manager', 'HR Specialist', 'HR Specialist - Talent Acquisition', 'HR Supervisor', 'HR Talent Manager', 'HR Training Manager', 'HR Vice President', 'HSE Manager', 'Hardware Engineer', 'Head', 'Head Bartender', 'Head Chef', 'Head Coach', 'Head Engineer', 'Head Production Manager', 'Head Recruiter', 'Head Trainer', 'Head of Accounting', 'Head of Administration', 'Head of Admissions', 'Head of Advertising', 'Head of Business Development', 'Head of Client Success', 'Head of Commercial Operations', 'Head of Communications', 'Head of Construction', 'Head of Creative', 'Head of Creative Services', 'Head of Department', 'Head of Design', 'Head of Development', 'Head of Digital', 'Head of Digital Marketing', 'Head of Engineering', 'Head of Finance', 'Head of Financial Analysis', 'Head of Financial Services', 'Head of Golf', 'Head of HR', 'Head of Human Resources', 'Head of IT', 'Head of IT Services', 'Head of Information Technology', 'Head of Leasing', 'Head of Legal', 'Head of Manufacturing', 'Head of Marketing', 'Head of Membership', 'Head of Operations', 'Head of Procurement', 'Head of Product', 'Head of Product Development', 'Head of Production', 'Head of Quality Assurance', 'Head of Recruiting', 'Head of Research', 'Head of Safety', 'Head of Sales', 'Head of School', 'Head of Security Operations', 'Head of Software Development', 'Head of Software Engineering', 'Head of Special Events', 'Head of Staff', 'Head of Strategy', 'Head of Talent Acquisition', 'Head of Technology', 'Head of Transportation', 'Health Coach', 'Health Insurance Agent', 'Health Manager', 'Health Services Medical Director', 'Healthcare Director', 'Healthcare Manager', 'Healthcare Representative', 'Healthcare Sales Representative', 'Healthcare Services Director', 'Hedge Fund Accountant', 'Hedge Fund Manager', 'Help Desk Specialist', 'Help Desk Support Specialist', 'Help Desk Technician', 'Helpdesk Engineer', 'Helpdesk Manager', 'Hiring Consultant', 'Holistic Chiropractor', 'Home Loan Advisor', 'Home Loan Specialist', 'Hospital Director', 'Hospital Pharmacist', 'Hospitality Director', 'Hospitality General Manager', 'Hospitality Manager', 'Hotel Manager', 'Human Capital Analyst', 'Human Capital Assistant', 'Human Capital Business Partner', 'Human Capital Manager', 'Human Resoruces Director', 'Human Resources Administrator', 'Human Resources Advisor', 'Human Resources Analyst', 'Human Resources Assistant', 'Human Resources Assistant Director', 'Human Resources Associate', 'Human Resources Associate Director', 'Human Resources Business Partner', 'Human Resources Consultant', 'Human Resources Coordinator', 'Human Resources Deputy Director', 'Human Resources Director', 'Human Resources Executive', 'Human Resources Executive Director', 'Human Resources Generalist', 'Human Resources Intern', 'Human Resources Leader', 'Human Resources Manager', 'Human Resources Officer', 'Human Resources Partner', 'Human Resources Professional', 'Human Resources Recruiter', 'Human Resources Rep', 'Human Resources Representative', 'Human Resources Senior Director', 'Human Resources Specialist', 'Human Resources Supervisor', 'Human Resources Vice President', 'ICT Manager', 'IT Admin', 'IT Administrator', 'IT Analyst', 'IT Assistant Manager', 'IT Business Analyst', 'IT Business Process Analyst', 'IT Business Systems Analyst', 'IT Consultant', 'IT Coordinator', 'IT Director', 'IT Engineer', 'IT Executive', 'IT Infrastructure Manager', 'IT Manager', 'IT Network Manager', 'IT Operations Director', 'IT Program Manager', 'IT Project Manager', 'IT Security Analyst', 'IT Solutions Consultant', 'IT Specialist', 'IT Strategy Consultant', 'IT Support Manager', 'IT Support Specialist', 'IT Support Technician', 'IT Systems Administrator', 'IT Systems Analyst', 'IT Systems Manager', 'IT Talent Acquisition Specialist', 'IT Team Lead', 'IT Technical Manager', 'IT Technician', 'IT Vice President', 'Illustrator', 'Implementation Consultant', 'Implementation Lead', 'Implementation Manager', 'Implementation Specialist', 'Import Coordinator', 'Import Manager', 'Import Operations Manager', 'Improvement Manager', 'Independent Advisor', 'Independent Consultant', 'Independent Contractor', 'Independent Distributor', 'Independent Owner Consultant', 'Independent Writer', 'Industrial Designer', 'Industrial Engineer', 'Industrial Process Engineer', 'Influencer', 'Information Communication Technology Manager', 'Information Security Analyst', 'Information Security Consultant', 'Information Security Specialist', 'Information Systems Manager', 'Information Technology Administrator', 'Information Technology Analyst', 'Information Technology Business Analyst', 'Information Technology Consultant', 'Information Technology Coordinator', 'Information Technology Director', 'Information Technology Engineer', 'Information Technology Executive', 'Information Technology Manager', 'Information Technology Recruiter', 'Information Technology Specialist', 'Information Technology Supervisor', 'Information Technology Support', 'Information Technology Support Specialist', 'Information Technology Technician', 'Infrastructure Manager', 'Infrastructure Project Manager', 'Innovation Manager', 'Innovative Partner', 'Inside Sales Specialist', 'Instruction Director', 'Instructional Assistant', 'Instructional Designer', 'Instructor', 'Insurance Agent', 'Insurance Agents', 'Insurance Broker', 'Insurance Claims Manager', 'Insurance Consultant', 'Insurance Sales Agent', 'Insurance Sales Representative', 'Interaction Designer', 'Interactive Digital Director', 'Interior Architectural Designer', 'Interior Design Consultant', 'Interior Designer', 'Intern', 'Intern Accountant', 'Intern in Finance', 'Internal Audit Director', 'Internal Audit Intern', 'Internal Audit Manager', 'Internal Auditor', 'International Export Manager', 'Internet Retail Manager', 'Internet Sales Manager', 'Internship', 'Internship Participant', 'Inventory Analyst', 'Inventory Control Manager', 'Inventory Coordinator', 'Inventory Manager', 'Inventory Planner', 'Inventory Specialist', 'Investigator', 'Investment Advisor', 'Investment Analyst', 'Investment Assets Manager', 'Investment Associate', 'Investment Banking Analyst', 'Investment Banking Associate', 'Investment Broker', 'Investment Consultant', 'Investment Director', 'Investment Fund Accountant', 'Investment Manager', 'Investment Partner', 'Investment Planner', 'Investment Portfolio Manager', 'Investment Research Analyst', 'Investment Strategy Director', 'Investments Director', 'Investor', 'Investor Relations', 'Investor Relations Analyst', 'Investor Relations Manager', 'Investor Relations Specialist', 'Ios Developer', 'Ios Software Engineer', 'Java Developer', 'Java Software Engineer', 'Journalist', 'Judicial Clerk', 'Junior Account Coordinator', 'Junior Account Director', 'Junior Account Executive', 'Junior Accountant', 'Junior Admissions Counselor', 'Junior Analyst', 'Junior Associate', 'Junior Buyer', 'Junior Clinical Research Associate', 'Junior Coach', 'Junior Consultant', 'Junior Equity Research Analyst', 'Junior Finance Analyst', 'Junior Finance Manager', 'Junior Financial Accountant', 'Junior Financial Advisor', 'Junior Implementation Specialist', 'Junior Java Developer', 'Junior Partner', 'Junior Practice Director', 'Junior Procurement Manager', 'Junior Product Manager', 'Junior Project Manager', 'Junior Research Analyst', 'Junior Research Assistant', 'Junior Research Scientist', 'Junior Revenue Manager', 'Junior Technical Services Manager', 'Junior Trader', 'Junior Trainee', 'Junior Treasury Analyst', 'Junior Vice President', 'Key Account Executive', 'Key Account Manager', 'Kitchen Manager', 'Lab Technician', 'Laboratory Director', 'Laboratory Manager', 'Laboratory Services Director', 'Land Consultant', 'Language Arts Teacher', 'Law Clerk', 'Lawyer', 'Lead Account Supervisor', 'Lead Accounting Clerk', 'Lead Accounts Payable', 'Lead Accounts Payable Manager', 'Lead Admissions Counselor', 'Lead Advisor', 'Lead Analyst', 'Lead Application Engineer', 'Lead Architect', 'Lead Art Director', 'Lead Assistant Brand Manager', 'Lead Assistant Operations Manager', 'Lead Associate', 'Lead Associate Consultant', 'Lead Audit Assistant', 'Lead Audit Associate', 'Lead Audit Manager', 'Lead Audit Supervisor', 'Lead Auditor', 'Lead BA', 'Lead Barista', 'Lead Board of Directors', 'Lead Brand Manager', 'Lead Business Analyst', 'Lead Business Consultant', 'Lead Business Manager', 'Lead Business Partner', 'Lead Buyer', 'Lead Chief Human Resources Officer', 'Lead Clinical Research Associate', 'Lead Communication Manager', 'Lead Compliance Analyst', 'Lead Construction Manager', 'Lead Consultant', 'Lead Consulting Manager', 'Lead Copywriter', 'Lead Counsel', 'Lead Credit Analyst', 'Lead Customer Service Manager', 'Lead Data Analyst', 'Lead Data Scientist', 'Lead Dentist', 'Lead Design Engineer', 'Lead Designer', 'Lead DevOps Engineer', 'Lead Developer', 'Lead Development Engineer', 'Lead Digital Designer', 'Lead Digital Marketing Consultant', 'Lead Digital Media Manager', 'Lead Digital Strategist', 'Lead Director of Project', 'Lead Director of Quality', 'Lead Director of Software Engineering', 'Lead Director of Technical Services', 'Lead Editor', 'Lead Electrical Engineer', 'Lead Engineer', 'Lead Engineering Manager', 'Lead Equity Research Analyst', 'Lead Escrow Officers', 'Lead Estimator', 'Lead Executive Recruiter', 'Lead Financial Accountant', 'Lead Financial Advisor', 'Lead Financial Analyst', 'Lead Financial Manager', 'Lead Financial Reporting Manager', 'Lead Founder', 'Lead Front Desk Agent', 'Lead Full Stack Developer', 'Lead Graphic Designer', 'Lead Human Resources Consultant', 'Lead Human Resources Generalist', 'Lead Implementation Specialist', 'Lead Improvement Manager', 'Lead Industrial Designer', 'Lead Information Technology Engineer', 'Lead Interior Designer', 'Lead Internal Auditor', 'Lead Ios Developer', 'Lead Leasing Consultant', 'Lead Lecturer', 'Lead Loan Officer', 'Lead Manager', 'Lead Managing Consultant', 'Lead Marketing Consultant', 'Lead Marketing Executive', 'Lead Marketing Manager', 'Lead Marketing Specialist', 'Lead Mechanical Design Engineer', 'Lead Mechanical Engineer', 'Lead Media Supervisor', 'Lead Member', 'Lead Network Engineer', 'Lead Operations Executive', 'Lead Partner', 'Lead Pastor', 'Lead Planner', 'Lead Practice Director', 'Lead Principal', 'Lead Principal Architects', 'Lead Principal Consultant', 'Lead Principal Scientist', 'Lead Process Engineer', 'Lead Procurement Manager', 'Lead Producer', 'Lead Product Designer', 'Lead Product Manager', 'Lead Production Engineer', 'Lead Program Director', 'Lead Project Engineer', 'Lead Project Manager', 'Lead Purchasing Coordinator', 'Lead Recruiter', 'Lead Recruitment Officer', 'Lead Research Analyst', 'Lead Research Associate', 'Lead Research Scientist', 'Lead Researcher', 'Lead Revenue Manager', 'Lead Safety Director', 'Lead Sales Consultant', 'Lead Sales Engineer', 'Lead Sales Manager', 'Lead Sales Negotiator', 'Lead Sales Representative', 'Lead Scientist', 'Lead Service Coordinator', 'Lead Site Manager', 'Lead Software Architect', 'Lead Software Consultant', 'Lead Software Development Manager', 'Lead Software Engineer', 'Lead Software Engineering Manager', 'Lead Solutions Architect', 'Lead Solutions Engineer', 'Lead Staff Engineer', 'Lead State Manager', 'Lead Strategist', 'Lead Strategy Advisor', 'Lead Structural Engineer', 'Lead Supervisor', 'Lead Support Manager', 'Lead System Administrator', 'Lead System Administrators', 'Lead System Analyst', 'Lead System Engineer', 'Lead Systems Administrator', 'Lead Systems Engineer', 'Lead Talent Acquisition Manager', 'Lead Talent Acquisition Partner', 'Lead Talent Development Manager', 'Lead Tax Specialist', 'Lead Team Member', 'Lead Technical Architect', 'Lead Technical Consultant', 'Lead Technical Director', 'Lead Technical Engineer', 'Lead Technical Officer', 'Lead Technical Recruiter', 'Lead Technical Services Manager', 'Lead Technical Team Member', 'Lead Technologist', 'Lead Territory Manager', 'Lead Treasury Analyst', 'Lead User Experience Designer', 'Lead Web Developer', 'Lead iOS Developer', 'Leader', 'Learning Director', 'Learning Manager', 'Leasing Agent', 'Leasing Consultant', 'Leasing Director', 'Leasing Manager', 'Lecturer', 'Legal Administrative Assistant', 'Legal Adviser', 'Legal Advisor', 'Legal Analyst', 'Legal Assistant', 'Legal Clerk', 'Legal Compliance Manager', 'Legal Consultant', 'Legal Contracts Manager', 'Legal Counsel', 'Legal Counselor', 'Legal Director', 'Legal Owner', 'Legal Partner', 'Legal Practitioner', 'Legal Research Assistant', 'Legal Secretary', 'Legal Specialist', 'Licensed Accountant', 'Licensed Broker Associate', 'Licensed Financial Representative', 'Licensed Insurance Agent', 'Licensed Insurance Broker', 'Licensed Real Estate Agent', 'Licensed Real Estate Broker', 'Licensed Realtor', 'Life Coach', 'Life Insurance Agent', 'Literature Teacher', 'Litigation Associate', 'Litigation Attorney', 'Litigation Counsel', 'Loan Officer', 'Loan Specialist', 'Logistics Analyst', 'Logistics Coordinator', 'Logistics Director', 'Logistics Manager', 'Logistics Specialist', 'Logistics Supervisor', 'Maintenance Coordinator', 'Maintenance Director', 'Maintenance Manager', 'Maintenance Operations Director', 'Maintenance Service Technician', 'Maintenance Supervisor', 'Maintenance Technician', 'Management Advisor', 'Management Analyst', 'Management Assistant', 'Management Associate', 'Management Consultant', 'Management Support', 'Management Support Assistant', 'Management consultant', 'Manager', 'Manager Human Resources', 'Manager for Payroll', 'Manager for Special Events', 'Manager of Administration', 'Manager of Billing', 'Manager of Business Operations', 'Manager of Clinical Projects', 'Manager of Content', 'Manager of Corporate Communications', 'Manager of Creative Services', 'Manager of Development', 'Manager of Division', 'Manager of Engineering', 'Manager of Events', 'Manager of Finance', 'Manager of Human Resources', 'Manager of IT', 'Manager of Manufacturing', 'Manager of Membership', 'Manager of Operations', 'Manager of Payroll Processing', 'Manager of People', 'Manager of Product', 'Manager of Production', 'Manager of Projects', 'Manager of Quality Assurance', 'Manager of Quality Control', 'Manager of Special Events', 'Manager of Taxation', 'Manager of Technical Products', 'Manager of Treasury', 'Manager of the Division', 'Managing Broker', 'Managing Consultant', 'Managing Dentist', 'Managing Director', 'Managing Director of Professional Services', 'Managing Editor', 'Managing Editorial Director', 'Managing Founder', 'Managing Member', 'Managing Partner', 'Managing President', 'Managing Principal', 'Managing Publisher', 'Managing Tax Partner', 'Manufacturing Coordinator', 'Manufacturing Director', 'Manufacturing Engineer', 'Manufacturing Executive', 'Manufacturing Manager', 'Manufacturing Operations Manager', 'Manufacturing Plant Controller', 'Manufacturing President', 'Manufacturing Process Engineer', 'Manufacturing Supervisor', 'Manufacturing Vice President', 'Market Analyst', 'Market Manager', 'Market Research Analyst', 'Marketing', 'Marketing Analyst', 'Marketing Assistant', 'Marketing Assistant Manager', 'Marketing Associate', 'Marketing Campaign Manager', 'Marketing Category Manager', 'Marketing Communications Coordinator', 'Marketing Communications Manager', 'Marketing Communications Officer', 'Marketing Communications Specialist', 'Marketing Consultant', 'Marketing Content Specialist', 'Marketing Coordinator', 'Marketing Coordinator Assistant', 'Marketing Development Specialist', 'Marketing Director', 'Marketing Events Manager', 'Marketing Executive', 'Marketing Executive Director', 'Marketing Executive Manager', 'Marketing Intern', 'Marketing Lead', 'Marketing Manager', 'Marketing Officer', 'Marketing Operations Manager', 'Marketing Professional', 'Marketing Program Manager', 'Marketing Project Manager', 'Marketing Representative', 'Marketing Senior Director', 'Marketing Specialist', 'Marketing Strategist', 'Marketing Strategy Consultant', 'Marketing Strategy Manager', 'Marketing Supervisor', 'Marketing Technology Analyst', 'Marketing Technology Manager', 'Marketing Vice President', 'Marketing Writer', 'Master Bartender', 'Master Electrician', 'Master Production Scheduler', 'Materials Coordinator', 'Materials Manager', 'Math Tutor', 'Mechanical Design Engineer', 'Mechanical Design Engineering Manager', 'Mechanical Engineer', 'Mechanical Engineering Manager', 'Media Buyer', 'Media Consultant', 'Media Director', 'Media Investment Manager', 'Media Manager', 'Media Planner', 'Media Planning Manager', 'Media Planning Specialist', 'Media Producer', 'Media Purchaser', 'Media Relations Coordinator', 'Media Relations Director', 'Media Relations Intern', 'Media Relations Manager', 'Media Relations Specialist', 'Media Supervisor', 'Medical Advisor', 'Medical Affairs Director', 'Medical Director', 'Medical Director of Health Services', 'Medical Doctor', 'Medical Fellow', 'Medical Laboratory Director', 'Medical Manager', 'Medical Practice Manager', 'Medical Representative', 'Medical Research Coordinator', 'Medical Sales Representative', 'Medical Services Director', 'Meeting Planner', 'Member Manager', 'Member of Board of Director', 'Member of Board of Trustees', 'Member of The Board', 'Member of The Board of Directors', 'Member of the Team', 'Membership Coordinator', 'Membership Director', 'Mentor', 'Merchandise Coordinator', 'Merchandise Manager', 'Merchandise Planner', 'Merchandise Planning Analyst', 'Merchandiser', 'Merchandiser of Visuals', 'Merchandising Manager', 'Merchandising Visual Specialist', 'Mergers Analyst', 'Mobile Application Developer', 'Mobile Developer', 'Mortgage Banker', 'Mortgage Consultant', 'Mortgage Loan Officer', 'Mortgage Loan Originator', 'Mortgage Specialist', 'Mortgage Underwriter', 'Mutual Fund Accountant', 'National Director of Sales', 'Neighborhood Director', 'Network Administrator', 'Network Analyst', 'Network Architect', 'Network Coordinator', 'Network Engineer', 'Network Infrastructure Manager', 'Network Manager', 'Network Operations Manager', 'Network Specialist', 'Network Systems Administrator', 'Network Systems Manager', 'New Business Development', 'New Business Development Manager', 'News Anchor', 'Nightclub Manager', 'Nonprofit Coordinator', 'Nonprofit Fundraiser', 'Novelist', 'Nurse Director', 'Nurse Manager', 'Nurse Practitioner', 'Nurse Supervisor', 'Nursing Director', 'Occupational Health Manager', 'Office Administrator', 'Office Assistant', 'Office Coordinator', 'Office Manager', 'Office Operations', 'Office Operations Manager', 'Office Support Specialist', 'Officer Chief of Development', 'Online Account Manager', 'Online Community Manager', 'Online Marketing Coordinator', 'Online Marketing Manager', 'Online Marketing Specialist', 'Online Producer', 'Online Retail Manager', 'Online Sales Manager', 'Operating Partner', 'Operational Manager', 'Operational Planning Manager', 'Operational Risk Analyst', 'Operational Risk Manager', 'Operations', 'Operations Analyst', 'Operations Assistant', 'Operations Assistant Manager', 'Operations Associate', 'Operations Coordinator', 'Operations Director', 'Operations Executive', 'Operations Executive Director', 'Operations Executive Vice President', 'Operations General Manager', 'Operations Lead', 'Operations Management Lead', 'Operations Manager', 'Operations Officer', 'Operations Resource Manager', 'Operations Senior Director', 'Operations Specialist', 'Operations Supervisor', 'Operations Team Lead', 'Operations Team Manager', 'Operations Vice President', 'Operator', 'Ops Manager', 'Optical Doctor', 'Optometrist', 'Organizational Development Manager', 'Original Member', 'Orthodontist', 'Outside Sales Representative', 'Owner', 'Owner Attorney', 'Owner-Operator', 'Owner/Operator', 'PR Communications Manager', 'PR Consultant', 'PR Coordinator', 'PR Director', 'PR Intern', 'PR Manager', 'PR Specialist', 'Paid Internship', 'Painter', 'Paralegal', 'Part-time Instructor', 'Partner', 'Partner Manager', 'Partner Relations', 'Partner Relations Manager', 'Partnership Manager', 'Partnerships', 'Partnerships Director', 'Partnerships Manager', 'Parts Manager', 'Pastor', 'Pastor in Charge', 'Pastoral Care Minister', 'Pastoral Leader', 'Patient Advocate', 'Patient Care Services Director', 'Pay Manager', 'Payroll Accountant', 'Payroll Administrator', 'Payroll Analyst', 'Payroll Coordinator', 'Payroll Manager', 'Payroll Operations Supervisor', 'Payroll Specialist', 'Payroll Supervisor', 'Pediatric Chiropractor', 'Pediatric Dentist', 'People Operations Intern', 'People Operations Manager', 'Personal Assistant', 'Personal Assistant To Chief Executive Officer', 'Personal Banker', 'Personal Coach', 'Personal Driver', 'Personal Financial Consultant', 'Personal Financial Planner', 'Personal Trainer', 'Personnel Administrator', 'Personnel Assistant', 'Personnel Manager', 'Personnel Officer', 'Pharma Sales Rep', 'Pharmaceutical Sales Representative', 'Pharmaceutical Services Director', 'Pharmacist', 'Pharmacist Manager', 'Pharmacy Director', 'Pharmacy Manager', 'Photographer', 'Photography Specialist', 'Photojournalist', 'Physical Education Director', 'Physical Therapist', 'Physician', 'Physician-Surgeon', 'Physiotherapist', 'Pioneer Director', 'Planner', 'Planner of Merchandise', 'Planning Director', 'Planning Manager', 'Planning Senior Director', 'Plant Controller', 'Plant Director', 'Plant Financial Controller', 'Plant Manager', 'Plant Operations Manager', 'Plant Supervisor', 'Portfolio Management Director', 'Portfolio Manager', 'Portfolio Program Manager', 'Postdoctoral Fellow', 'Postdoctoral Researcher', 'Practice Director', 'Practice Manager', 'Practice Operations Manager', 'Preconstruction Manager', 'Preconstruction Project Manager', 'President', 'Price Manager', 'Pricing Analyst', 'Pricing Manager', 'Principal', 'Principal Account Executive', 'Principal Admissions Counselor', 'Principal Advisor', 'Principal Architect', 'Principal Architects', 'Principal Architecture Designers', 'Principal Art Director', 'Principal Associate', 'Principal Audit Assistant', 'Principal Audit Manager', 'Principal Business Analyst', 'Principal Business Consultant', 'Principal Business Manager', 'Principal Buyer', 'Principal Chief Risk Officer', 'Principal Compliance Analyst', 'Principal Construction Manager', 'Principal Consultant', 'Principal Data Analyst', 'Principal Data Scientist', 'Principal Design Engineer', 'Principal Designer', 'Principal Developer', 'Principal Development Engineer', 'Principal Digital Designer', 'Principal Director of Special Projects', 'Principal Director of Technical Services', 'Principal Electrical Engineer', 'Principal Engineer', 'Principal Escrow Officers', 'Principal Financial Accountant', 'Principal Financial Advisor', 'Principal Financial Analyst', 'Principal HR Adviser', 'Principal Human Resources Consultant', 'Principal Human Resources Generalist', 'Principal Implementation Specialist', 'Principal Interior Designer', 'Principal Investment Banking Associate', 'Principal Lawyer', 'Principal Marketing Executive', 'Principal Mechanical Design Engineer', 'Principal Mechanical Engineer', 'Principal Network Engineer', 'Principal Partner', 'Principal Planner', 'Principal Practice Director', 'Principal Process Engineer', 'Principal Procurement Manager', 'Principal Producer', 'Principal Product Designer', 'Principal Product Manager', 'Principal Production Assistant', 'Principal Project Accountant', 'Principal Project Engineer', 'Principal Research Analyst', 'Principal Research Associate', 'Principal Research Scientist', 'Principal Researcher', 'Principal Revenue Manager', 'Principal Sales Engineer', 'Principal Sales Specialist', 'Principal Scientist', 'Principal Software Architect', 'Principal Software Consultant', 'Principal Software Engineer', 'Principal Solutions Architect', 'Principal Solutions Engineer', 'Principal Staff Engineer', 'Principal Strategy Consultant', 'Principal Strategy Manager', 'Principal Structural Engineer', 'Principal Surveyor', 'Principal System Administrator', 'Principal System Engineer', 'Principal Systems Administrator', 'Principal Systems Developer', 'Principal Systems Engineer', 'Principal Talent Acquisition Partner', 'Principal Technical Architect', 'Principal Technical Consultant', 'Principal Technical Lead', 'Principal Technical Services Manager', 'Principal Territory Manager', 'Principal Treasury Analyst', 'Principal User Experience Designer', 'Principal Web Developer', 'Private Equity Investor', 'Private Tutor', 'Private Wealth Manager', 'Process Engineer', 'Process Engineering Manager', 'Process Improvement Analyst', 'Process Improvement Director', 'Process Improvement Manager', 'Process Manager', 'Procurement Agent', 'Procurement Analyst', 'Procurement Analysts', 'Procurement Coordinator', 'Procurement Coordinators', 'Procurement Director', 'Procurement Manager', 'Procurement Managers', 'Procurement Officers', 'Procurement Specialist', 'Procurement Specialists', 'Procurement Supervisor', 'Producer', 'Producer/Director', 'Product Analyst', 'Product Brand Manager', 'Product Category Manager', 'Product Champion', 'Product Consultant', 'Product Coordinator', 'Product Design Consultant', 'Product Design Engineer', 'Product Design Manager', 'Product Designer', 'Product Developer', 'Product Development Director', 'Product Development Engineer', 'Product Development Manager', 'Product Director', 'Product Engineer', 'Product Industrial Designer', 'Product Innovation Director', 'Product Innovation Manager', 'Product Lead', 'Product Management Assistant', 'Product Management Director', 'Product Management Specialist', 'Product Manager', 'Product Marketing Manager', 'Product Owner', 'Product Pricing Manager', 'Product Service Manager', 'Product Solutions Manager', 'Product Specialist', 'Product Supervisor', 'Production Assistant', 'Production Control Planner', 'Production Coordinator', 'Production Director', 'Production Engineer', 'Production Head', 'Production Manager', 'Production Operations Manager', 'Production Planner', 'Production Scheduler', 'Production Senior Director', 'Production Studio Manager', 'Production Supervisor', 'Professional Accountant', 'Professional Development Coordinator', 'Professional Development Manager', 'Professional Guide', 'Professional Photographer', 'Professional Services Director', 'Professional Services Managing Director', 'Professional in Financial Services', 'Professor', 'Professor of Economics', 'Program Coordinator', 'Program Director', 'Program Management Director', 'Program Manager', 'Program Marketing Manager', 'Programme Manager', 'Programmer', 'Programmer Analyst', 'Programs Director', 'Programs Senior Director', 'Project Accountant', 'Project Accounting Manager', 'Project Accounting Supervisor', 'Project Administrator', 'Project Analyst', 'Project Architect', 'Project Assistant', 'Project Consultant', 'Project Controller', 'Project Coordinator', 'Project Design Architect', 'Project Designer', 'Project Director', 'Project Engineer', 'Project Engineering Manager', 'Project Engineering Supervisor', 'Project Estimator', 'Project Executive', 'Project Lead', 'Project Lead Director', 'Project Management Assistant', 'Project Management Coordinator', 'Project Management Director', 'Project Management Executive', 'Project Management Lead', 'Project Management Leader', 'Project Management Senior Director', 'Project Manager', 'Project Marketing Manager', 'Project Senior Director', 'Project Specialist', 'Project Superintendent', 'Project Supervisor', 'Project Support Specialist', 'Projects Director', 'Promotional Model', 'Promotions Coordinator', 'Proofreader', 'Property Accountant', 'Property Administrator', 'Property Advisor', 'Property Broker', 'Property Consultant', 'Property Facilities Manager', 'Property Leasing Consultant', 'Property Management Assistant', 'Property Management Assistant Director', 'Property Management Director', 'Property Management Executive Director', 'Property Management Senior Director', 'Property Manager', 'Property Operations Manager', 'Property Portfolio Manager', 'Property Sales Agent', 'Property Sales Consultant', 'Proposal Coordinator', 'Proposal Manager', 'Proposal Specialist', 'Proprietor', 'Psychologist', 'Pub Manager', 'Public Accountant', 'Public Relations Assistant', 'Public Relations Coordinator', 'Public Relations Director', 'Public Relations Intern', 'Public Relations Manager', 'Public Relations Officer', 'Public Relations Specialist', 'Publication Editor', 'Publisher', 'Purchase Manager', 'Purchasing Agent', 'Purchasing Analysts', 'Purchasing Assistant', 'Purchasing Buyer', 'Purchasing Coordinator', 'Purchasing Director', 'Purchasing Manager', 'Purchasing Officer', 'Purchasing Specialist', 'Purchasing Supervisor', 'QA Analyst', 'QA Director', 'QA Engineer', 'QA Manager', 'QA Tester', 'QC Manager', 'Quality Assurance Analyst', 'Quality Assurance Associate', 'Quality Assurance Director', 'Quality Assurance Engineer', 'Quality Assurance Manager', 'Quality Assurance Specialist', 'Quality Compliance Manager', 'Quality Control Analyst', 'Quality Control Chemist', 'Quality Control Director', 'Quality Control Engineer', 'Quality Control Laboratory Manager', 'Quality Control Manager', 'Quality Control Specialist', 'Quality Director', 'Quality Engineer', 'Quality Engineering', 'Quality Improvement Manager', 'Quality Lead Director', 'Quality Management Director', 'Quality Manager', 'Quality Process Engineer', 'Quality Senior Director', 'Quality Test Engineer', 'Quantitative Analyst', 'Quantitative Risk Analyst', 'Quantity Surveyor', 'Real Estate Accountant', 'Real Estate Advisor', 'Real Estate Agent', 'Real Estate Assistant Director', 'Real Estate Broker', 'Real Estate Broker Associate', 'Real Estate Brokerage', 'Real Estate Consultant', 'Real Estate Director', 'Real Estate Executive Director', 'Real Estate Investor', 'Real Estate Manager', 'Real Estate Officer', 'Real Estate Property Manager', 'Real Estate Sales Broker', 'Real Estate Salesperson', 'Real Estate Senior Director', 'Real Property Manager', 'Realtor', 'Realty Specialist', 'Receptionist', 'Recruiter', 'Recruiting Coordinator', 'Recruiting Director', 'Recruiting Manager', 'Recruiting Specialist', 'Recruitment Advisor', 'Recruitment Consultant', 'Recruitment Coordinator', 'Recruitment Director', 'Recruitment Leader', 'Recruitment Manager', 'Recruitment Officer', 'Recruitment Operations Manager', 'Recruitment Specialist', 'Regional Account Manager', 'Regional Business Development Manager', 'Regional Director', 'Regional Director of Sales', 'Regional Manager', 'Regional Relationship Manager', 'Regional Sales Manager', 'Regional Sales Representative', 'Registered Nurse', 'Registered Nurse Manager', 'Regulatory Affairs Director', 'Regulatory Affairs Manager', 'Regulatory Compliance Director', 'Regulatory Compliance Manager', 'Regulatory Compliance Officer', 'Rehabilitation Therapist', 'Relationship Manager', 'Reporter', 'Research Analyst', 'Research Assistant', 'Research Associate', 'Research Chemist', 'Research Coordinator', 'Research Director', 'Research Engineer', 'Research Fellow', 'Research Intern', 'Research Laboratory Director', 'Research Laboratory Manager', 'Research Manager', 'Research Principal Scientist', 'Research Scientist', 'Researcher', 'Reseller', 'Resident Advisor', 'Resident Assistant', 'Resident Coordinator', 'Resident Services Assistant', 'Residential Broker Owner', 'Residential Interior Designer', 'Residential Leasing Manager', 'Residential Property Manager', 'Residential Real Estate Broker', 'Residential Sales Specialist', 'Resort Manager', 'Resource Manager', 'Restaurant Director', 'Restaurant General Manager', 'Restaurant Manager', 'Restaurant Operations Manager', 'Retail Assistant Manager', 'Retail Banker', 'Retail Buyer', 'Retail Category Manager', 'Retail Manager', 'Retail Merchandise Planner', 'Retail Merchandiser', 'Retail Merchandising Manager', 'Retail Office Manager', 'Retail Operations Director', 'Retail Operations Manager', 'Retail Sales Assistant', 'Retail Sales Associate', 'Retail Sales Manager', 'Retail Sales Specialist', 'Retail Sales Supervisor', 'Retail Store Director', 'Revenue Analyst', 'Revenue Chief', 'Revenue Director', 'Revenue Forecasting Manager', 'Revenue Manager', 'Revenue Officer', 'Risk Analyst', 'Risk Assurance Manager', 'Risk Management Executive', 'Risk Management Specialist', 'Risk Manager', 'Rooms Director', 'Rooms Division Director', 'SEM Manager', 'SEM Specialist', 'SEO Analyst', 'SEO Manager', 'SEO Specialist', 'Safety Compliance Manager', 'Safety Coordinator', 'Safety Director', 'Safety Manager', 'Sales Account Executive', 'Sales Account Manager', 'Sales Account Representative', 'Sales Administration Coordinator', 'Sales Administrator', 'Sales Advisor', 'Sales Agent', 'Sales Analyst', 'Sales Assistant', 'Sales Assistant Director', 'Sales Associate', 'Sales Associate Partner', 'Sales Channel Manager', 'Sales Consultant', 'Sales Consulting Manager', 'Sales Coordinator', 'Sales Corporate Director', 'Sales Data Analyst', 'Sales Development Executive', 'Sales Development Manager', 'Sales Development Representative', 'Sales Development Specialist', 'Sales Director', 'Sales Engineer', 'Sales Engineering Manager', 'Sales Executive', 'Sales Executive Vice President', 'Sales Intern', 'Sales Manager', 'Sales National Director', 'Sales Negotiator', 'Sales Operations Administrator', 'Sales Operations Analyst', 'Sales Operations Coordinator', 'Sales Operations Director', 'Sales Operations Manager', 'Sales Operations Specialist', 'Sales Partner', 'Sales Program Manager', 'Sales Project Manager', 'Sales Regional Director', 'Sales Representative', 'Sales Representative - Pharmaceuticals', 'Sales Senior Assistant Director', 'Sales Senior Director', 'Sales Senior Vice President', 'Sales Solutions Consultant', 'Sales Specialist', 'Sales Supervisor', 'Sales Support', 'Sales Support Administrator', 'Sales Support Assistant', 'Sales Support Coordinator', 'Sales Team Lead', 'Sales Team Leader', 'Sales Team Supervisor', 'Sales Territory Manager', 'Sales VP', 'Sales Vice President', 'Salesman', 'Scholar', 'School Director', 'School Principal', 'Science Engineer', 'Scientist', 'Sculptor', 'Search Engine Optimization Analyst', 'Search Engine Optimization Manager', 'Search Engine Optimization Specialist', 'Seasonal Analyst', 'Seasonal Associate', 'Seasoned Construction Manager', 'Seasoned System Administrator', 'Secondary English Teacher', 'Secretary', 'Security Consultant', 'Security Director', 'Security Manager', 'Security Operations Analyst', 'Security Risk Consultant', 'Self-Employed Consultant', 'Self-Employed Contractor', 'Self-Employed Professional', 'Self-Employed Writer', 'Senior Account Coordinator', 'Senior Account Director', 'Senior Account Executive', 'Senior Account Manager', 'Senior Account Supervisor', 'Senior Accountant', 'Senior Accounting Analyst', 'Senior Accounting Clerk', 'Senior Accounting Manager', 'Senior Accounting Supervisor', 'Senior Accounts Assistant', 'Senior Accounts Payable', 'Senior Accounts Payable Manager', 'Senior Accounts Payable Supervisor', 'Senior Admissions Counselor', 'Senior Advisor', 'Senior Ambassador', 'Senior Analyst', 'Senior Application Engineer', 'Senior Application Specialist', 'Senior Architect', 'Senior Architectural Consultant', 'Senior Area Manager', 'Senior Art Director', 'Senior Asset Manager', 'Senior Assistant Account Manager', 'Senior Assistant Brand Manager', 'Senior Assistant Director of Sales', 'Senior Assistant Operations Manager', 'Senior Assistant Professor', 'Senior Associate', 'Senior Associate Consultant', 'Senior Associate Principal', 'Senior Assurance Associate', 'Senior Attorney', 'Senior Audit Assistant', 'Senior Audit Associate', 'Senior Audit Manager', 'Senior Audit Partner', 'Senior Audit Supervisor', 'Senior Auditor', 'Senior Automation Engineer', 'Senior Backend Developer', 'Senior Bartender', 'Senior Benefits Manager', 'Senior Board Member', 'Senior Board of Directors', 'Senior Bookkeeper', 'Senior Brand Manager', 'Senior Budget Analyst', 'Senior Business Analyst', 'Senior Business Consultant', 'Senior Business Controller', 'Senior Business Development Executive', 'Senior Business Development Manager', 'Senior Business Director', 'Senior Business Intelligence Manager', 'Senior Business Manager', 'Senior Business Partner', 'Senior Business Systems Analyst', 'Senior Buyer', 'Senior Category Manager', 'Senior Chief Accountant', 'Senior Chief Estimator', 'Senior Chief Human Resources Officer', 'Senior Chief Risk Officer', 'Senior Client Account Supervisor', 'Senior Client Director', 'Senior Client Manager', 'Senior Client Partner', 'Senior Clinical Director', 'Senior Clinical Research Associate', 'Senior Communication Manager', 'Senior Communications Coordinator', 'Senior Communications Manager', 'Senior Compliance Analyst', 'Senior Compliance Officer', 'Senior Compliance Specialist', 'Senior Construction Manager', 'Senior Consultant', 'Senior Consultant in Marketing', 'Senior Consulting Associate', 'Senior Consulting Manager', 'Senior Content Editor', 'Senior Content Producer', 'Senior Content Strategist', 'Senior Controller', 'Senior Copywriter', 'Senior Corporate Counsel', 'Senior Counsel', 'Senior Creative Director', 'Senior Credit Analyst', 'Senior Credit Manager', 'Senior Credit Officer', 'Senior Customer Service Manager', 'Senior Customer Success Manager', 'Senior Customer Support Manager', 'Senior Data Analyst', 'Senior Data Scientist', 'Senior Design Architect', 'Senior Design Consultant', 'Senior Design Director', 'Senior Design Engineer', 'Senior Designer', 'Senior DevOps Engineer', 'Senior Developer', 'Senior Development Engineer', 'Senior Development Manager', 'Senior Digital Designer', 'Senior Digital Director', 'Senior Digital Marketing Consultant', 'Senior Digital Marketing Executive', 'Senior Digital Marketing Manager', 'Senior Digital Media Manager', 'Senior Digital Sales Manager', 'Senior Digital Strategist', 'Senior Director', 'Senior Director of Analytics', 'Senior Director of Business Development', 'Senior Director of Construction', 'Senior Director of Development', 'Senior Director of Events', 'Senior Director of Finance', 'Senior Director of Financial Reporting', 'Senior Director of Human Resources', 'Senior Director of Marketing', 'Senior Director of Operations', 'Senior Director of Planning', 'Senior Director of Production', 'Senior Director of Programs', 'Senior Director of Project', 'Senior Director of Project Management', 'Senior Director of Property Management', 'Senior Director of Quality', 'Senior Director of Real Estate', 'Senior Director of Sales', 'Senior Director of Social Media', 'Senior Director of Software Engineering', 'Senior Director of Special Projects', 'Senior Director of Strategic Partnerships', 'Senior Director of Technical Services', 'Senior District Manager', 'Senior Editor', 'Senior Editorial Director', 'Senior Electrical Engineer', 'Senior Employee Relations Manager', 'Senior Engineer', 'Senior Engineering Director', 'Senior Engineering Manager', 'Senior Equity Research Analyst', 'Senior Escrow Officers', 'Senior Estimator', 'Senior Event Coordinator', 'Senior Event Manager', 'Senior Event Planner', 'Senior Events Manager', 'Senior Executive', 'Senior Executive Assistant', 'Senior Executive Assistant To Chief Executive Officer', 'Senior Executive Human Resources', 'Senior Executive Officer', 'Senior Executive Producer', 'Senior Executive Recruiter', 'Senior Export Manager', 'Senior Facilities Coordinator', 'Senior Finance Analyst', 'Senior Finance Business Partner', 'Senior Finance Manager', 'Senior Finance Officer', 'Senior Financial Accountant', 'Senior Financial Advisor', 'Senior Financial Analyst', 'Senior Financial Controller', 'Senior Financial Manager', 'Senior Financial Reporting Manager', 'Senior Financial Representative', 'Senior Fleet Manager', 'Senior Front Desk Agent', 'Senior Frontend Developer', 'Senior Full Stack Developer', 'Senior Fund Accountant', 'Senior General Counsel', 'Senior General Manager', 'Senior Graphic Designer', 'Senior HR Business Partner', 'Senior HR Consultant', 'Senior HR Director', 'Senior HR Executive', 'Senior HR Manager', 'Senior HR Specialist', 'Senior Head of Marketing', 'Senior Human Resources Advisor', 'Senior Human Resources Business Partner', 'Senior Human Resources Consultant', 'Senior Human Resources Executive', 'Senior Human Resources Generalist', 'Senior Human Resources Manager', 'Senior Human Resources Partner', 'Senior Human Resources Supervisor', 'Senior IT Director', 'Senior IT Engineer', 'Senior IT Manager', 'Senior IT Recruiter', 'Senior IT Solutions Consultant', 'Senior Implementation Specialist', 'Senior Improvement Manager', 'Senior Industrial Designer', 'Senior Information Technology Consultant', 'Senior Information Technology Manager', 'Senior Instructional Designer', 'Senior Intelligence Analyst', 'Senior Interior Designer', 'Senior Internal Auditor', 'Senior Investment Advisor', 'Senior Investment Analyst', 'Senior Investment Banking Associate', 'Senior Investment Director', 'Senior Ios Developer', 'Senior Java Developer', 'Senior Journalist', 'Senior Lead Pastor', 'Senior Leasing Consultant', 'Senior Lecturer', 'Senior Legal Counsel', 'Senior Lending Officer', 'Senior Litigation Associate', 'Senior Loan Officer', 'Senior Logistics Manager', 'Senior Management', 'Senior Management Consultant', 'Senior Manager', 'Senior Manager of Accounting', 'Senior Manager of Business Development', 'Senior Manager of Communications', 'Senior Managing Consultant', 'Senior Managing Principal', 'Senior Marketing Analyst', 'Senior Marketing Associate', 'Senior Marketing Consultant', 'Senior Marketing Coordinator', 'Senior Marketing Executive', 'Senior Marketing Manager', 'Senior Marketing Officer', 'Senior Marketing Representative', 'Senior Marketing Specialist', 'Senior Marketing Supervisor', 'Senior Mechanical Design Engineer', 'Senior Mechanical Engineer', 'Senior Media Supervisor', 'Senior Medical Officer', 'Senior Member', 'Senior Merchandise Planner', 'Senior Merchandiser', 'Senior Merchandising Manager', 'Senior Mortgage Banker', 'Senior Network Engineer', 'Senior Office Manager', 'Senior Operating Officer', 'Senior Operations Analyst', 'Senior Operations Director', 'Senior Operations Executive', 'Senior Operations Manager', 'Senior Operations Specialist', 'Senior Partner', 'Senior Pastor', 'Senior Payroll Administrator', 'Senior Payroll Coordinator', 'Senior Personal Assistant', 'Senior Planner', 'Senior Planning Analyst', 'Senior Planning Manager', 'Senior Plant Controller', 'Senior Portfolio Manager', 'Senior Practice Director', 'Senior President', 'Senior Pricing Manager', 'Senior Principal', 'Senior Principal Architects', 'Senior Principal Consultant', 'Senior Principal Scientist', 'Senior Process Engineer', 'Senior Process Improvement Engineer', 'Senior Procurement Manager', 'Senior Procurement Supervisor', 'Senior Producer', 'Senior Product Designer', 'Senior Product Developer', 'Senior Product Development Manager', 'Senior Product Engineer', 'Senior Product Industrial Designer', 'Senior Product Manager', 'Senior Product Manager - Categories', 'Senior Product Marketing Manager', 'Senior Production Assistant', 'Senior Production Engineer', 'Senior Production Manager', 'Senior Production Planner', 'Senior Professor', 'Senior Program Coordinator', 'Senior Program Director', 'Senior Program Manager', 'Senior Project Accountant', 'Senior Project Controller', 'Senior Project Coordinator', 'Senior Project Engineer', 'Senior Project Executive', 'Senior Project Leader', 'Senior Project Manager', 'Senior Property Accountant', 'Senior Property Manager', 'Senior Proposal Manager', 'Senior Public Relations Manager', 'Senior Publisher', 'Senior Purchasing Coordinator', 'Senior Purchasing Manager', 'Senior QA Analyst', 'Senior Quality Engineer', 'Senior Quality Manager', 'Senior Quantity Surveyor', 'Senior Recruiter', 'Senior Recruiting Manager', 'Senior Recruitment Consultant', 'Senior Recruitment Officer', 'Senior Recruitment Specialist', 'Senior Relationship Manager', 'Senior Research Analyst', 'Senior Research Assistant', 'Senior Research Associate', 'Senior Research Manager', 'Senior Research Scientist', 'Senior Researcher', 'Senior Resident Assistant', 'Senior Resource Manager', 'Senior Retail Manager', 'Senior Revenue Manager', 'Senior Risk Analyst', 'Senior Risk Manager', 'Senior Safety Director', 'Senior Sales Agent', 'Senior Sales Analyst', 'Senior Sales Associate', 'Senior Sales Consultant', 'Senior Sales Director', 'Senior Sales Engineer', 'Senior Sales Executive', 'Senior Sales Manager', 'Senior Sales Negotiator', 'Senior Sales Partner', 'Senior Sales Representative', 'Senior Sales Specialist', 'Senior Scientist', 'Senior Security Consultant', 'Senior Service Coordinator', 'Senior Site Manager', 'Senior Software Architect', 'Senior Software Consultant', 'Senior Software Developer', 'Senior Software Development Manager', 'Senior Software Engineer', 'Senior Software Engineering Manager', 'Senior Solutions Architect', 'Senior Solutions Consultant', 'Senior Solutions Engineer', 'Senior Solutions Manager', 'Senior Staff Accountant', 'Senior Staff Engineer', 'Senior State Manager', 'Senior Strategic Account Executive', 'Senior Strategic Account Manager', 'Senior Strategic Advisor', 'Senior Strategist', 'Senior Strategy Consultant', 'Senior Strategy Manager', 'Senior Structural Engineer', 'Senior Superintendent', 'Senior Supervisor', 'Senior Support Manager', 'Senior System Administrator', 'Senior System Administrators', 'Senior System Analyst', 'Senior System Engineer', 'Senior Systems Administrator', 'Senior Systems Analyst', 'Senior Systems Design Engineer', 'Senior Systems Engineer', 'Senior TA Specialist', 'Senior Talent Acquisition Consultant', 'Senior Talent Acquisition Manager', 'Senior Talent Acquisition Partner', 'Senior Talent Acquisition Specialist', 'Senior Talent Manager', 'Senior Tax Accountant', 'Senior Tax Associate', 'Senior Tax Consultant', 'Senior Tax Manager', 'Senior Tax Partner', 'Senior Team Leader', 'Senior Technical Consultant', 'Senior Technical Director', 'Senior Technical Lead', 'Senior Technical Manager', 'Senior Technical Recruiter', 'Senior Technical Services Manager', 'Senior Technical Specialist', 'Senior Technical Team Lead', 'Senior Technical Writer', 'Senior Technology Manager', 'Senior Territory Manager', 'Senior Test Engineer', 'Senior Test Manager', 'Senior Trader', 'Senior Transaction Coordinators', 'Senior Treasury Analyst', 'Senior Treasury Manager', 'Senior UX Designer', 'Senior UX/UI Designer', 'Senior Underwriter', 'Senior Underwriting Manager', 'Senior User Experience Designer', 'Senior VP', 'Senior Vice President', 'Senior Vice President of Business Development', 'Senior Vice President of Construction', 'Senior Vice President of Customer Relations', 'Senior Vice President of Development', 'Senior Vice President of Engineering', 'Senior Vice President of Finance', 'Senior Vice President of Sales', 'Senior Video Producer', 'Senior Visual Designer', 'Senior Wealth Manager', 'Senior Web Developer', 'Senior Writer', 'Senior iOS Developer', 'Serial Entrepreneur', 'Service Coordinator', 'Service Delivery Manager', 'Service Desk Associate', 'Service Director', 'Service Engineer', 'Service Manager', 'Service Specialist', 'Service Technician', 'Shareholder', 'Shareowner', 'Shift Manager', 'Shift Supervisor', 'Shipping Coordinator', 'Shipping Manager', 'Shipping Supervisor', 'Shop Manager', 'Showroom Manager', 'Showroom Supervisor', 'Site Director', 'Site Engineer', 'Site Manager', 'Site Superintendent', 'Site Supervisor', 'Small Business Owner', 'Small Business Partner', 'Social Entrepreneur', 'Social Media Coordinator', 'Social Media Director', 'Social Media Manager', 'Social Media Marketing Coordinator', 'Social Media Marketing Director', 'Social Media Marketing Manager', 'Social Media Senior Director', 'Social Media Specialist', 'Social Media Strategist', 'Social Media Strategy Director', 'Social Worker', 'Software Application Engineer', 'Software Application Specialist', 'Software Applications Engineer', 'Software Architect', 'Software Automation Engineer', 'Software Consultant', 'Software Developer', 'Software Development Director', 'Software Development Engineer', 'Software Development Lead', 'Software Development Manager', 'Software Engineer', 'Software Engineering', 'Software Engineering Director', 'Software Engineering Lead Director', 'Software Engineering Manager', 'Software Engineering Senior Director', 'Software Program Manager', 'Software Programmer', 'Software Quality Engineer', 'Software Solutions Consultant', 'Software Systems Manager', 'Software Technical Manager', 'Software Test Engineer', 'Sole Proprietor', 'Solicitor', 'Solution Architect', 'Solution Engineer', 'Solutions Architect', 'Solutions Consultant', 'Solutions Manager', 'Solutions engineer', 'Sourcing Analysts', 'Sourcing Consultant', 'Sourcing Manager', 'Sourcing Specialist', 'Sourcing Supervisor', 'Sous Chef', 'Special Events', 'Special Events Coordinator', 'Special Events Director', 'Special Events Manager', 'Special Projects Director', 'Special Projects Manager', 'Special Projects Principal Director', 'Special Projects Senior Director', 'Special Projects Staff Director', 'Specialist', 'Specialist in Social Media', 'Specialist in Technology', 'Specialist in Technology Support', 'Sports Chiropractor', 'Sports Coach', 'Sports Director', 'Sssociate Principal', 'Staff Accountant', 'Staff Bookkeeper', 'Staff Chief Risk Officer', 'Staff Director of Special Projects', 'Staff Engineer', 'Staff Investment Banking Associate', 'Staff Member', 'Staff Product Manager', 'Staff Production Assistant', 'Staff Project Accountant', 'Staff Project Manager', 'Staff Software Engineer', 'Staff Strategy Manager', 'Staff Writer', 'Staffing Consultant', 'Staffing Coordinator', 'Staffing Manager', 'Staffing Recruiter', 'Staffing Specialist', 'Startup Founder', 'State Manager', 'Stock Broker', 'Stock Manager', 'Stockholder', 'Store Assistant Manager', 'Store Director', 'Store Manager', 'Store Operations Director', 'Store Owner', 'Strategic Account Coordinator', 'Strategic Account Executive', 'Strategic Account Manager', 'Strategic Accounts Director', 'Strategic Analyst', 'Strategic Buyer', 'Strategic Client Director', 'Strategic Client Partner', 'Strategic Development Manager', 'Strategic Development Specialist', 'Strategic Finance Partner', 'Strategic Initiatives Director', 'Strategic Manager', 'Strategic Partnerships Manager', 'Strategic Partnerships Senior Director', 'Strategic Planner', 'Strategic Planning Director', 'Strategic Planning Manager', 'Strategist', 'Strategy Consultant', 'Strategy Consulting Manager', 'Strategy Director', 'Strategy Manager', 'Structural Engineer', 'Student Ambassador', 'Student Internship', 'Student Representative', 'Studio Manager', 'Studio Operations Manager', 'Subcontractor', 'Summer Analyst', 'Summer Associate', 'Summer Intern', 'Summer Internship', 'Superintendent', 'Supervisor', 'Supervisor of Customer Service', 'Supervisor of Marketing', 'Supervisor of Warehouse', 'Supply Chain Analyst', 'Supply Chain Analysts', 'Supply Chain Coordinator', 'Supply Chain Director', 'Supply Chain Manager', 'Supply Chain Planner', 'Supply Chain Specialist', 'Supply Chain Supervisor', 'Supply Manager', 'Support Engineer', 'Support Manager', 'Support Specialist for Information Technology', 'Sustainability Manager', 'System Administrators', 'System Analyst', 'Systems Administration Manager', 'Systems Administrator', 'Systems Analyst', 'Systems Application Engineer', 'Systems Automation Engineer', 'Systems Coordinator', 'Systems Engineer', 'Systems Engineering Manager', 'Systems Manager', 'Systems Operations Manager', 'Systems Supervisor', 'Tactician', 'Talent Acquisition Assistant', 'Talent Acquisition Consultant', 'Talent Acquisition Coordinator', 'Talent Acquisition Director', 'Talent Acquisition Manager', 'Talent Acquisition Partner', 'Talent Acquisition Specialist', 'Talent Coordinator', 'Talent Development Manager', 'Talent Management Advisor', 'Talent Management Manager', 'Talent Management Specialist', 'Talent Manager', 'Talent Sourcing Coordinator', 'Tax Accountant', 'Tax Accountant Manager', 'Tax Advisor', 'Tax Advisory Partner', 'Tax Associate', 'Tax Compliance Director', 'Tax Consultant', 'Tax Director', 'Tax Manager', 'Tax Partner', 'Tax Senior Associate', 'Tax Specialist', 'Tax Supervisor', 'Taxation', 'Taxation Consultant', 'Teacher', 'Teacher\'s Aide', 'Teaching Assistant', 'Team Coach', 'Team Coordinator', 'Team Lead', 'Team Leader', 'Team Manager', 'Team Member', 'Team Supervisor', 'Tech Consultant', 'Tech Entrepreneur', 'Tech Lead', 'Tech Manager', 'Technical Analyst', 'Technical Application Specialist', 'Technical Architect', 'Technical Business Development Manager', 'Technical Consultant', 'Technical Director', 'Technical Documentation Specialist', 'Technical Engineering Manager', 'Technical Infrastructure Manager', 'Technical Lead', 'Technical Manager', 'Technical Marketing Manager', 'Technical Marketing Specialist', 'Technical Product Leader', 'Technical Product Manager', 'Technical Program Manager', 'Technical Project Lead', 'Technical Project Manager', 'Technical Recruiter', 'Technical Recruiting Manager', 'Technical Recruitment Lead', 'Technical Sales Engineer', 'Technical Sales Representative', 'Technical Service Engineer', 'Technical Service Manager', 'Technical Service Technician', 'Technical Services Director', 'Technical Services Executive Director', 'Technical Services Lead Director', 'Technical Services Manager', 'Technical Services Principal Director', 'Technical Services Senior Director', 'Technical Services Specialist', 'Technical Solutions Architect', 'Technical Solutions Consultant', 'Technical Solutions Manager', 'Technical Specialist', 'Technical Support Analyst', 'Technical Support Engineer', 'Technical Support Manager', 'Technical Support Specialist', 'Technical Systems Analyst', 'Technical Team Lead', 'Technical Team Supervisor', 'Technical Writer', 'Technician', 'Technology Analyst', 'Technology Applications Engineer', 'Technology Architect', 'Technology Business Analyst', 'Technology Chief Officer', 'Technology Consultant', 'Technology Coordinator', 'Technology Director', 'Technology Executive', 'Technology Innovation Manager', 'Technology Lead', 'Technology Manager', 'Technology Program Manager', 'Technology Programme Manager', 'Technology Risk Analyst', 'Technology Specialist', 'Technology Supervisor', 'Technology Vice President', 'Teller Supervisor', 'Temporary Associate', 'Terminal Manager', 'Territory Account Manager', 'Territory Business Manager', 'Territory Manager', 'Territory Sales Manager', 'Territory Sales Representative', 'Test Engineer', 'Test Manager', 'Testing Manager', 'Testing Specialist', 'Theater Director', 'Therapist', 'Tier 2 Support Engineer', 'Title Officer', 'Top Recruiter', 'Total Rewards Analyst', 'Town Manager', 'Trade Marketing Manager', 'Trader', 'Traffic Manager', 'Trainee', 'Trainer', 'Training Coordinator', 'Training Director', 'Training Manager', 'Training Specialist', 'Transaction Analyst', 'Transaction Officer', 'Transportation Analyst', 'Transportation Coordinator', 'Transportation Director', 'Transportation Engineer', 'Transportation Fleet Manager', 'Transportation Manager', 'Transportation Planner', 'Transportation Specialist', 'Transportation Supervisor', 'Travel Agent', 'Treasurer', 'Treasury Analyst', 'Treasury Manager', 'Treasury Operations Manager', 'Truck Driver', 'Trust Officer', 'Trustee', 'Tutor', 'UI Designer', 'UI Developer', 'UI/UX Designer', 'UX Designer', 'UX/UI Designer', 'Undergraduate Research Assistant', 'Underwriter', 'Underwriting Analyst', 'Underwriting Director', 'Underwriting Manager', 'Underwriting Supervisor', 'Unit Coordinator', 'Unit Director', 'Unit Leader', 'Unit Manager', 'Unit Supervisor', 'University Ambassador', 'Urban Planner', 'User Experience Designer', 'User Experience Manager', 'User Interface Designer', 'User Interface Developer', 'User Interface/Experience Designer', 'User experience Designer', 'User interface Designer', 'VP of Administration', 'VP of Business Development', 'VP of Business Expansion', 'VP of Customer Experience', 'VP of Development', 'VP of Engineering', 'VP of Finance', 'VP of HR', 'VP of Lending Operations', 'VP of Manufacturing', 'VP of Marketing', 'VP of Operations', 'VP of Portfolio Management', 'VP of Product', 'VP of Production', 'VP of Sales', 'Vendor Management Specialist', 'Vendor Manager', 'Venture Capitalist', 'Vice Chairman', 'Vice Chairman of the Board', 'Vice President', 'Vice President Commercial Lending', 'Vice President of Administration', 'Vice President of Business Development', 'Vice President of Client Services', 'Vice President of Commercial Finance', 'Vice President of Construction', 'Vice President of Development', 'Vice President of Engineering', 'Vice President of Finance', 'Vice President of Human Resources', 'Vice President of Manufacturing', 'Vice President of Marketing', 'Vice President of Operations', 'Vice President of Sales', 'Vice President of Technology', 'Vice Principal', 'Video Producer', 'Video Production Manager', 'Virtual Assistant', 'Vision Specialist', 'Visiting Lecturer', 'Visiting Professor', 'Visual Communication Designer', 'Visual Design', 'Visual Design Director', 'Visual Designer', 'Visual Merchandiser', 'Visual Merchandising Manager', 'Visuals Merchandising Specialist', 'Volunteer', 'Volunteer Coordinator', 'Volunteer Manager', 'Volunteer Program Coordinator', 'Volunteer Services Coordinator', 'Warehouse Director', 'Warehouse Inventory Manager', 'Warehouse Lead', 'Warehouse Logistics Supervisor', 'Warehouse Manager', 'Warehouse Operations Manager', 'Warehouse Operations Supervisor', 'Warehouse Supervisor', 'Wealth Advisor', 'Wealth Management Advisor', 'Wealth Management Associate', 'Wealth Management Consultant', 'Wealth Manager', 'Wealth Portfolio Manager', 'Web Application Developer', 'Web Designer', 'Web Developer', 'Web Optimization Analyst', 'Web Programmer', 'Web Project Manager', 'Webmaster', 'Website Manager', 'Wedding Planner', 'Wellness Manager', 'Wholesale Distributor', 'Workforce Planning Advisor', 'Writer', 'iOS Developer'
  ].sort();

  /**
   * Load saved progress from localStorage on mount
   * Why this matters: Restores user's playbook creation progress across page refreshes.
   */
  useEffect(() => {
    const savedProgress = localStorage.getItem('apollo_playbook_progress');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setSelectedJobTitle(progress.selectedJobTitle || '');
        setRawData(progress.rawData || '');
        setMarkdownData(progress.markdownData || '');
        setHasConversionCompleted(progress.hasConversionCompleted || false);
        setCurrentStep(progress.currentStep || 1);
        setConversionStage(progress.conversionStage || '');
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }

    // After initial load, allow auto-save to work
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, []);

  /**
   * Auto-save progress to localStorage with debouncing
   * Why this matters: Prevents users from losing their work when the page refreshes or crashes.
   */
  useEffect(() => {
    // Skip auto-save if this is the initial load from localStorage
    if (isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set auto-save status to saving
    setAutoSaveStatus('saving');

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      try {
        const progressData = {
          selectedJobTitle,
          rawData,
          markdownData,
          hasConversionCompleted,
          currentStep,
          conversionStage,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('apollo_playbook_progress', JSON.stringify(progressData));
        
        setAutoSaveStatus('saved');
        
        // Clear the "saved" status after 2 seconds
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('');
      }
    }, 1000); // Save after 1 second of inactivity

    setAutoSaveTimeout(timeout);

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [selectedJobTitle, rawData, markdownData, hasConversionCompleted, currentStep, conversionStage]);

  /**
   * Filter job titles based on search term
   * Why this matters: Makes it easy to find specific job titles in a long list.
   */
  const getFilteredJobTitles = (): string[] => {
    if (!jobTitleSearch) return jobTitles;
    return jobTitles.filter(title => 
      title.toLowerCase().includes(jobTitleSearch.toLowerCase())
    );
  };

  /**
   * Handle job title selection
   * Why this matters: Sets the selected job title for progression validation.
   */
  const handleJobTitleSelect = (jobTitle: string): void => {
    setSelectedJobTitle(jobTitle);
    setJobTitleSearch('');
    setShowJobTitleDropdown(false);
    setError('');
    setHighlightedIndex(-1);
  };

  /**
   * Handle input changes for job title search
   * Why this matters: Enables real-time filtering and proper dropdown state management.
   */
  const handleJobTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setJobTitleSearch(value);
    setSelectedJobTitle('');
    setShowJobTitleDropdown(true);
    setHighlightedIndex(-1);
  };

  /**
   * Handle input focus
   * Why this matters: Opens dropdown when user focuses on the input.
   */
  const handleInputFocus = (): void => {
    setShowJobTitleDropdown(true);
  };

  /**
   * Handle keyboard navigation
   * Why this matters: Provides intuitive keyboard navigation for accessibility.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!showJobTitleDropdown) return;
    
    const filteredTitles = getFilteredJobTitles();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredTitles.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTitles.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredTitles.length) {
          handleJobTitleSelect(filteredTitles[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowJobTitleDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  /**
   * Handle raw data changes
   * Why this matters: Updates raw data state for validation and auto-save.
   */
  const handleRawDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setRawData(e.target.value);
  };

  /**
   * Navigate to next step
   * Why this matters: Provides forward navigation with validation checks.
   */
  const handleNextStep = (): void => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   * Why this matters: Provides backward navigation for step corrections.
   */
  const handlePreviousStep = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Check if next step is available
   * Why this matters: Validates required data before allowing progression.
   */
  const canGoToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedJobTitle;
      case 2:
        return !!rawData.trim();
      case 3:
        return hasConversionCompleted;
      default:
        return false;
    }
  };

  /**
   * Convert raw data to markdown
   * Why this matters: Processes user input through OpenAI to create structured markdown with staged progress feedback.
   */
  const convertToMarkdown = async (): Promise<void> => {
    if (!rawData.trim()) return;

    setIsConverting(true);
    setError('');
    setConversionProgress(0);
    setConversionStage('');

    // Define conversion stages with progress ranges and durations
    const stages = [
      { text: 'Analyzing raw data...', startProgress: 0, endProgress: 25, duration: 5500 },
      { text: 'Extracting key insights...', startProgress: 25, endProgress: 50, duration: 5500 },
      { text: 'Structuring content...', startProgress: 50, endProgress: 75, duration: 5500 },
      { text: 'Formatting markdown...', startProgress: 75, endProgress: 95, duration: 5500 },
      { text: 'Almost done...', startProgress: 95, endProgress: 99, duration: 5500 }
    ];

    let currentStageIndex = 0;
    let stageStartTime = Date.now();

    // Animate progress bar through stages - exactly 27.5 seconds to reach 99%
    progressIntervalRef.current = setInterval(() => {
      const currentStage = stages[currentStageIndex];
      if (!currentStage) return;

      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);
      const progressRange = currentStage.endProgress - currentStage.startProgress;
      const newProgress = currentStage.startProgress + (progressRange * stageProgress);

      setConversionProgress(Math.min(newProgress, 99));
      setConversionStage(currentStage.text);

      // Move to next stage when current stage is complete
      if (stageProgress >= 1 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        stageStartTime = Date.now();
      }
    }, 50); // Update every 50ms for smooth animation

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/playbooks/convert-to-markdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: selectedJobTitle,
          raw_data: rawData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to convert data to markdown: ${errorMessage}`);
      }

      const data = await response.json();
      setMarkdownData(data.markdown_content);
      
      // Clear progress interval first
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Complete the progress
      setConversionProgress(100);
      setConversionStage('Conversion completed!');
      setHasConversionCompleted(true);

    } catch (error) {
      console.error('Error converting to markdown:', error);
      setError('Failed to convert data to markdown. Please try again.');
      setConversionProgress(0);
      setConversionStage('');
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } finally {
      setIsConverting(false);
    }
  };

  /**
   * Handle playbook generation
   * Why this matters: Triggers the playbook generation modal with processed data.
   */
  const handleGeneratePlaybook = (): void => {
    onPlaybookGenerate(selectedJobTitle, markdownData);
  };

  /**
   * Show confirmation modal for starting over
   * Why this matters: Provides a safety check before clearing all playbook progress
   */
  const showStartOverConfirmation = (): void => {
    setShowStartOverModal(true);
  };

  /**
   * Clear progress after confirmation
   * Why this matters: Performs the actual clearing after user confirms they want to start over
   */
  const confirmStartOver = (): void => {
    clearProgress();
    setShowStartOverModal(false);
  };

  /**
   * Cancel the start over action
   * Why this matters: Allows users to back out of the destructive action
   */
  const cancelStartOver = (): void => {
    setShowStartOverModal(false);
  };

  /**
   * Clear saved progress
   * Why this matters: Allows users to start fresh by clearing localStorage data.
   */
  const clearProgress = (): void => {
    localStorage.removeItem('apollo_playbook_progress');
    setSelectedJobTitle('');
    setJobTitleSearch('');
    setRawData('');
    setMarkdownData('');
    setHasConversionCompleted(false);
    setCurrentStep(1);
    setConversionStage('');
    setError('');
  };

  /**
   * Close job title dropdown when clicking outside
   * Why this matters: Provides intuitive UX for the dropdown menu.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobTitleDropdownRef.current && !jobTitleDropdownRef.current.contains(event.target as Node)) {
        setShowJobTitleDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Cleanup progress interval on unmount
   * Why this matters: Prevents memory leaks.
   */
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  /**
   * Render step indicators
   * Why this matters: Shows overall progress and which step user is currently on.
   */
  const renderStepIndicators = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '2rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      border: '0.0625rem solid #e2e8f0'
    }}>
      {[1, 2, 3, 4].map((step) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: currentStep === step ? '#3b82f6' : currentStep > step ? '#10b981' : '#e5e7eb',
            color: currentStep >= step ? 'white' : '#6b7280',
            transition: 'all 0.2s ease'
          }}>
            {currentStep > step ? <CheckCircle size={14} /> : step}
          </div>
          {step < 4 && (
            <div style={{
              width: '2rem',
              height: '0.125rem',
              backgroundColor: currentStep > step ? '#10b981' : '#e5e7eb',
              marginLeft: '0.5rem',
              marginRight: '0.5rem',
              transition: 'all 0.2s ease'
            }} />
          )}
        </div>
      ))}
    </div>
  );

  /**
   * Render current step content
   * Why this matters: Shows only the relevant step to avoid overwhelming the user.
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">1</div>
                <h2 className="card-title">Select Job Title</h2>
              </div>
            </div>
            
            <div className="card-content">
              <div className="input-group">
                <label className="input-label">
                  Choose the job title you want to create a playbook for:
                </label>
                <div className="relative max-w-sm" ref={jobTitleDropdownRef}>
                  <div className="input-container" onClick={() => setShowJobTitleDropdown(true)}>
                    <Search className="input-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={selectedJobTitle || jobTitleSearch}
                      onChange={handleJobTitleInputChange}
                      onFocus={() => setShowJobTitleDropdown(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search or select job title..."
                      className="dropdown-input"
                      autoComplete="off"
                    />
                    <ChevronDown className={`dropdown-chevron ${showJobTitleDropdown ? 'rotated' : ''}`} />
                  </div>
                  
                  {showJobTitleDropdown && (
                    <div className="dropdown-menu relative" style={{ position: 'relative', marginTop: '0.25rem' }}>
                      {getFilteredJobTitles().length > 0 ? (
                        getFilteredJobTitles().map((jobTitle, index) => (
                          <div
                            key={jobTitle}
                            className={`dropdown-item ${selectedJobTitle === jobTitle ? 'selected' : ''} ${
                              highlightedIndex === index ? 'highlighted' : ''
                            }`}
                            onClick={() => handleJobTitleSelect(jobTitle)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                          >
                            {jobTitle}
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item disabled">
                          No job titles found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {selectedJobTitle && (
                  <div className="selected-item">
                    <FileText size={16} />
                    <span>Selected: {selectedJobTitle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">2</div>
                <h2 className="card-title">Add Raw Data</h2>
              </div>
            </div>
            
            <div className="card-content">
              <div className="input-group">
                <label className="input-label">
                  Provide best times, performance data, and email templates for {selectedJobTitle}
                </label>
                <textarea
                  value={rawData}
                  onChange={handleRawDataChange}
                  placeholder={`Enter data for ${selectedJobTitle}:

- Best days/hours
- Total opens/delivered, open rates
- Top email templates`}
                  rows={8}
                  className="textarea-input"
                />
                <div className="input-helper-text">
                  This data will be processed and converted to structured markdown format
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">3</div>
                <h2 className="card-title">Convert to Markdown</h2>
              </div>
            </div>
            
            <div className="card-content">
              {!hasConversionCompleted ? (
                <div className="action-section">
                  <p className="section-description">
                    Converting data into structured markdown format for easy processing
                  </p>
                  
                  {isConverting && (
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${conversionProgress}%` }}
                        />
                      </div>
                      <p className="progress-text">
                        {conversionStage ? conversionStage : 'Initializing...'} {Math.round(conversionProgress)}%
                      </p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={convertToMarkdown}
                    disabled={isConverting || !rawData.trim()}
                    className="primary-button"
                  >
                    {isConverting ? (
                      <>
                        <Clock className="animate-spin" size={16} />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Convert to Markdown
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="success-section">
                  <div className="success-indicator">
                    <CheckCircle size={20} />
                    <span>Markdown conversion completed successfully!</span>
                  </div>
                  <div className="markdown-preview">
                    <h4>Preview:</h4>
                    <div className="markdown-content">
                      <pre>{markdownData.substring(0, 300)}...</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="step-indicator active">
                  <Sparkles size={16} />
                </div>
                <h2 className="card-title">Generate Playbook</h2>
              </div>
            </div>
            
            <div className="card-content">
              <div className="final-step-section">
                <div className="summary-card">
                  <h4>Ready to Generate</h4>
                  <div className="summary-items">
                    <div className="summary-item">
                      <span className="summary-label">Job Title:</span>
                      <span className="summary-value">{selectedJobTitle}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Data Status:</span>
                      <span className="summary-value">Processed & Ready</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleGeneratePlaybook}
                  className="primary-button large"
                >
                  <Wand2 size={18} />
                  Generate {selectedJobTitle} Playbook
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * Render navigation buttons
   * Why this matters: Provides clear navigation controls between steps with proper validation.
   */
  const renderNavigationButtons = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      border: '0.0625rem solid #e2e8f0'
    }}>
      <button
        onClick={handlePreviousStep}
        disabled={currentStep === 1}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: currentStep === 1 ? '#f3f4f6' : 'white',
          color: currentStep === 1 ? '#9ca3af' : '#374151',
          border: '0.0625rem solid #d1d5db',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          if (currentStep !== 1) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseOut={(e) => {
          if (currentStep !== 1) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {currentStep > 1 && (
          <button
            onClick={showStartOverConfirmation}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
          >
            Start Over
          </button>
        )}

        {currentStep < 4 && (
          <button
            onClick={handleNextStep}
            disabled={!canGoToNextStep()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: canGoToNextStep() ? '#3b82f6' : '#f3f4f6',
              color: canGoToNextStep() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: canGoToNextStep() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (canGoToNextStep()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (canGoToNextStep()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Auto-save status indicator */}
      {autoSaveStatus && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          border: '0.0625rem solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1), 0 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.06)',
          color: autoSaveStatus === 'saving' ? '#6b7280' : '#10b981',
          fontSize: '0.875rem',
          fontWeight: '500',
          pointerEvents: 'none'
        }}>
          {autoSaveStatus === 'saving' ? (
            <>
              <Clock className="animate-spin" style={{ width: '0.75rem', height: '0.75rem' }} />
              Auto-saving progress...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Progress auto-saved
            </>
          )}
        </div>
      )}

      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        {/* Step indicators */}
        {renderStepIndicators()}
        
        {/* Current step content */}
        {renderCurrentStep()}
        
        {/* Navigation buttons */}
        {renderNavigationButtons()}
      </div>

      {/* Confirmation Modal */}
      {showStartOverModal && (
        <div className={`confirmation-modal-backdrop ${showStartOverModal ? 'open' : ''}`}>
          <div className={`confirmation-modal ${showStartOverModal ? 'open' : ''}`}>
            <div className="confirmation-modal-header">
              <div className="confirmation-modal-icon">
                <AlertTriangle style={{width: '1.5rem', height: '1.5rem'}} />
              </div>
              <h3 className="confirmation-modal-title">Start Over?</h3>
              <p className="confirmation-modal-message">
                This action will clear all your current playbook progress including selected job title, raw data, and converted markdown. This cannot be undone.
              </p>
            </div>
            <div className="confirmation-modal-actions">
              <button
                onClick={cancelStartOver}
                className="confirmation-modal-btn confirmation-modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartOver}
                className="confirmation-modal-btn confirmation-modal-btn-confirm"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaybooksInterface; 