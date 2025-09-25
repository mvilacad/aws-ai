import { ViolationCase, MonitoringSubject } from '@aws-ai/shared';

export const sampleMonitoringSubjects: MonitoringSubject[] = [
  {
    id: 'subj_001',
    name: 'John Smith',
    email: 'john.smith.sample@example.com',
    phone: '+1-555-0123',
    dateOfBirth: '1990-05-15T00:00:00.000Z',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      country: 'USA',
      isVerified: true,
    },
    convictionDetails: {
      charges: ['Theft', 'Burglary'],
      convictionDate: '2022-03-15T00:00:00.000Z',
      sentenceLength: '2 years probation',
      conditions: [
        'Weekly check-ins with probation officer',
        'Community service 100 hours',
        'No contact with victims',
        'Restricted travel outside county',
      ],
      courtJurisdiction: 'Springfield County Court',
    },
    monitoringStatus: 'active',
    riskProfile: {
      overallRisk: 'medium',
      riskFactors: [
        'Prior offense history',
        'Employment instability',
        'Limited family support',
      ],
      lastAssessment: '2024-01-15T00:00:00.000Z',
      nextReviewDate: '2024-07-15T00:00:00.000Z',
    },
    assignedOfficer: 'officer_001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'subj_002',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez.sample@example.com',
    phone: '+1-555-0234',
    dateOfBirth: '1985-08-22T00:00:00.000Z',
    address: {
      street: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
      country: 'USA',
      isVerified: true,
    },
    convictionDetails: {
      charges: ['Drug Possession'],
      convictionDate: '2023-06-10T00:00:00.000Z',
      sentenceLength: '18 months probation',
      conditions: [
        'Monthly drug testing',
        'Attendance at NA meetings',
        'Employment requirement',
        'No association with known drug users',
      ],
      courtJurisdiction: 'Springfield County Court',
    },
    monitoringStatus: 'active',
    riskProfile: {
      overallRisk: 'high',
      riskFactors: [
        'Substance abuse history',
        'Multiple failed drug tests',
        'Unstable housing situation',
      ],
      lastAssessment: '2024-02-01T00:00:00.000Z',
      nextReviewDate: '2024-05-01T00:00:00.000Z',
    },
    assignedOfficer: 'officer_002',
    createdAt: '2023-06-15T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 'subj_003',
    name: 'David Johnson',
    email: 'david.johnson.sample@example.com',
    dateOfBirth: '1992-11-03T00:00:00.000Z',
    address: {
      street: '789 Pine Rd',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62703',
      country: 'USA',
      isVerified: false,
    },
    convictionDetails: {
      charges: ['Assault'],
      convictionDate: '2023-09-20T00:00:00.000Z',
      sentenceLength: '2 years probation',
      conditions: [
        'Anger management classes',
        'No contact with victim',
        'Weekly probation meetings',
        'Mental health counseling',
      ],
      courtJurisdiction: 'Springfield County Court',
    },
    monitoringStatus: 'active',
    riskProfile: {
      overallRisk: 'high',
      riskFactors: [
        'History of violence',
        'Mental health issues',
        'Non-compliance with court orders',
      ],
      lastAssessment: '2024-01-20T00:00:00.000Z',
      nextReviewDate: '2024-04-20T00:00:00.000Z',
    },
    assignedOfficer: 'officer_001',
    createdAt: '2023-09-25T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z',
  },
];

export const sampleViolationCases: ViolationCase[] = [
  {
    id: 'case_001',
    subjectId: 'subj_001',
    subjectName: 'John Smith',
    description:
      'Failed to report for scheduled probation meeting. Subject was supposed to check in on Monday but did not show up or contact the office.',
    severity: 'medium',
    status: 'investigating',
    detectedAt: '2024-03-15T10:30:00.000Z',
    assignedTo: 'officer_001',
    evidence: [
      {
        id: 'ev_001',
        type: 'data',
        source: 'probation_system',
        content:
          'No check-in recorded for scheduled appointment on 2024-03-15 09:00:00',
        timestamp: '2024-03-15T10:30:00.000Z',
        metadata: {
          scheduledTime: '2024-03-15T09:00:00.000Z',
          lastContact: '2024-03-08T14:00:00.000Z',
        },
      },
    ],
    analysis: {
      riskScore: 65,
      riskFactors: [
        {
          factor: 'Non-compliance with probation requirements',
          weight: 0.8,
          description:
            'Failure to report is a direct violation of probation terms',
          evidence: ['ev_001'],
        },
      ],
      recommendations: [
        'Contact subject immediately to determine reason for absence',
        'Schedule make-up appointment within 48 hours',
        'Consider increased supervision level if pattern continues',
      ],
      similarCases: ['case_045', 'case_012'],
      aiConfidence: 0.85,
    },
    timeline: [
      {
        id: 'event_001',
        type: 'detected',
        description: 'Automated system detected missed probation appointment',
        timestamp: '2024-03-15T10:30:00.000Z',
        actor: 'system',
      },
    ],
    tags: ['missed_appointment', 'probation_violation', 'non_compliance'],
  },
  {
    id: 'case_002',
    subjectId: 'subj_002',
    subjectName: 'Maria Rodriguez',
    description:
      'Positive drug test result detected during routine monthly screening. Test showed presence of cocaine metabolites.',
    severity: 'high',
    status: 'open',
    detectedAt: '2024-03-20T14:15:00.000Z',
    assignedTo: 'officer_002',
    evidence: [
      {
        id: 'ev_002',
        type: 'data',
        source: 'drug_testing_lab',
        content:
          'Positive result for cocaine metabolites. Concentration: 150 ng/mL (cutoff: 50 ng/mL)',
        timestamp: '2024-03-20T14:15:00.000Z',
        metadata: {
          testType: 'Urine',
          labId: 'LAB_123456',
          collectionDate: '2024-03-18T10:00:00.000Z',
          certificationLevel: 'DOT_Approved',
        },
      },
      {
        id: 'ev_003',
        type: 'document',
        source: 'probation_file',
        content:
          'Subject has history of drug-related violations. Previous positive test 6 months ago.',
        timestamp: '2024-03-20T15:00:00.000Z',
      },
    ],
    analysis: {
      riskScore: 85,
      riskFactors: [
        {
          factor: 'Substance abuse relapse',
          weight: 0.9,
          description:
            'Positive drug test indicates return to illegal substance use',
          evidence: ['ev_002'],
        },
        {
          factor: 'Pattern of non-compliance',
          weight: 0.7,
          description:
            'Previous positive tests show ongoing struggle with compliance',
          evidence: ['ev_003'],
        },
      ],
      recommendations: [
        'Immediate intervention required',
        'Consider intensive outpatient treatment program',
        'Increase drug testing frequency to weekly',
        'Refer to substance abuse counseling',
        'Evaluate need for residential treatment',
      ],
      similarCases: ['case_078', 'case_156', 'case_203'],
      aiConfidence: 0.92,
    },
    timeline: [
      {
        id: 'event_002',
        type: 'detected',
        description: 'Positive drug test result received from laboratory',
        timestamp: '2024-03-20T14:15:00.000Z',
        actor: 'system',
      },
      {
        id: 'event_003',
        type: 'assigned',
        description:
          'Case assigned to supervising officer for immediate action',
        timestamp: '2024-03-20T14:30:00.000Z',
        actor: 'supervisor_001',
      },
    ],
    tags: ['drug_violation', 'positive_test', 'high_risk', 'relapse'],
  },
  {
    id: 'case_003',
    subjectId: 'subj_003',
    subjectName: 'David Johnson',
    description:
      'Subject was arrested for disorderly conduct at a local bar. Police report indicates aggressive behavior and resistance to arrest.',
    severity: 'critical',
    status: 'open',
    detectedAt: '2024-03-22T23:45:00.000Z',
    assignedTo: 'officer_001',
    evidence: [
      {
        id: 'ev_004',
        type: 'document',
        source: 'police_report',
        content:
          'Subject became aggressive with bar staff and other patrons. Required physical restraint by officers.',
        timestamp: '2024-03-22T23:45:00.000Z',
        metadata: {
          arrestingOfficer: 'Officer Badge #4567',
          location: 'Shamrock Bar, 234 Main St',
          charges: ['Disorderly Conduct', 'Resisting Arrest'],
        },
      },
      {
        id: 'ev_005',
        type: 'witness_statement',
        source: 'bar_staff',
        content:
          'Subject was intoxicated and became violent when asked to leave. Threw a chair and threatened customers.',
        timestamp: '2024-03-23T01:00:00.000Z',
      },
    ],
    analysis: {
      riskScore: 95,
      riskFactors: [
        {
          factor: 'New criminal activity',
          weight: 1.0,
          description:
            'New arrest while on probation represents serious violation',
          evidence: ['ev_004'],
        },
        {
          factor: 'Violence escalation',
          weight: 0.9,
          description:
            'Pattern of violent behavior consistent with previous conviction',
          evidence: ['ev_004', 'ev_005'],
        },
        {
          factor: 'Alcohol involvement',
          weight: 0.6,
          description:
            'Substance abuse may be contributing factor to violations',
          evidence: ['ev_005'],
        },
      ],
      recommendations: [
        'Immediate revocation hearing recommended',
        'Consider detention pending hearing',
        'Alcohol assessment required',
        'Anger management program evaluation',
        'Mental health assessment needed',
      ],
      similarCases: ['case_234', 'case_189'],
      aiConfidence: 0.95,
    },
    timeline: [
      {
        id: 'event_004',
        type: 'detected',
        description:
          'Arrest notification received from local police department',
        timestamp: '2024-03-22T23:45:00.000Z',
        actor: 'police_system',
      },
      {
        id: 'event_005',
        type: 'escalated',
        description: 'Case escalated to supervisor due to critical risk level',
        timestamp: '2024-03-23T08:00:00.000Z',
        actor: 'officer_001',
      },
    ],
    tags: ['new_arrest', 'violence', 'critical_risk', 'probation_violation'],
  },
];

export async function seedViolations(): Promise<void> {
  console.log('Seeding violation data...');
  console.log(`Created ${sampleMonitoringSubjects.length} monitoring subjects`);
  console.log(`Created ${sampleViolationCases.length} violation cases`);
}
