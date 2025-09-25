import { Document } from '@aws-ai/shared';

export const sampleDocuments: Document[] = [
  {
    id: 'doc_001',
    title: 'Illinois Probation Guidelines 2024',
    content: `
# Illinois Probation Guidelines 2024

## Overview
These guidelines establish the standards and procedures for probation supervision in the State of Illinois.

## Reporting Requirements
Probationers must report to their supervising officer according to the schedule established by the court:
- High-risk individuals: Weekly reporting
- Medium-risk individuals: Bi-weekly reporting
- Low-risk individuals: Monthly reporting

## Violation Classifications
### Class A Violations (Critical)
- New criminal activity
- Failure to report for 30+ days
- Positive drug tests (2+ consecutive)
- Threats against officers or public

### Class B Violations (High)
- Missed appointments (3+ in 30 days)
- Single positive drug test
- Failure to complete court-ordered programs
- Travel outside jurisdiction without permission

### Class C Violations (Medium)
- Late reporting (1-2 instances)
- Failure to notify address change within 48 hours
- Minor program violations

## Response Protocols
Officers must respond to violations according to established timelines:
- Class A: Immediate action required (within 24 hours)
- Class B: Action required within 72 hours
- Class C: Action required within 1 week

## Documentation Requirements
All violations must be documented with:
- Date and time of occurrence
- Detailed description of violation
- Evidence collected
- Officer assessment and recommendations
- Risk level determination
    `,
    contentType: 'text/markdown',
    size: 1450,
    uploadedBy: 'system',
    uploadedAt: '2024-01-01T00:00:00.000Z',
    status: 'indexed',
    tags: ['guidelines', 'probation', 'illinois', 'policy'],
    metadata: {
      author: 'Illinois Department of Corrections',
      version: '2024.1',
      effectiveDate: '2024-01-01',
      lastReviewed: '2024-01-01',
    },
  },
  {
    id: 'doc_002',
    title: 'Drug Testing Procedures Manual',
    content: `
# Drug Testing Procedures Manual

## Testing Frequency
- High-risk probationers: Weekly testing
- Medium-risk probationers: Bi-weekly testing
- Low-risk probationers: Monthly testing
- Random testing may be conducted at any time

## Chain of Custody
All drug tests must follow strict chain of custody procedures:
1. Proper identification of subject
2. Witnessed collection process
3. Sealed specimen containers
4. Documentation of all handlers
5. Secure transport to certified laboratory

## Positive Test Procedures
When a positive test result is received:
1. Verify chain of custody documentation
2. Notify supervising officer within 24 hours
3. Schedule immediate meeting with probationer
4. Document in case file
5. Initiate violation proceedings if appropriate

## Cutoff Levels
Standard cutoff levels for common substances:
- Cocaine: 50 ng/mL
- Marijuana (THC): 50 ng/mL
- Amphetamines: 500 ng/mL
- Opiates: 300 ng/mL
- Alcohol: 0.02 BAC

## Quality Assurance
- All tests conducted by certified laboratories
- Regular calibration of equipment
- Blind quality control samples
- Annual laboratory inspection requirements
    `,
    contentType: 'text/markdown',
    size: 1200,
    uploadedBy: 'admin_001',
    uploadedAt: '2024-01-15T00:00:00.000Z',
    status: 'indexed',
    tags: ['drug_testing', 'procedures', 'laboratory', 'policy'],
    metadata: {
      author: 'Lab Services Division',
      version: '3.2',
      lastUpdated: '2024-01-15',
    },
  },
  {
    id: 'doc_003',
    title: 'Case Management Best Practices',
    content: `
# Case Management Best Practices

## Risk Assessment
Regular risk assessment is critical for effective supervision:
- Initial assessment within 30 days of case assignment
- Reassessment every 6 months for high-risk cases
- Annual reassessment for medium and low-risk cases
- Immediate reassessment after any violation

## Documentation Standards
All case activities must be documented:
- Contact attempts (successful and unsuccessful)
- Meeting summaries and outcomes
- Violation reports and responses
- Court appearances and results
- Program participation and progress

## Communication Protocols
### With Probationers
- Clear expectations at case initiation
- Regular check-ins per risk level
- Prompt response to inquiries
- Professional and respectful interactions

### With Other Agencies
- Coordinate with treatment providers
- Share relevant information with law enforcement
- Collaborate with court personnel
- Maintain contact with employers when appropriate

## Crisis Management
Officers must be prepared to handle crisis situations:
- Immediate threats to public safety
- Mental health emergencies
- Domestic violence situations
- Substance abuse relapses

Emergency contact procedures:
1. Assess immediate danger
2. Contact emergency services if needed
3. Notify supervisor
4. Document all actions taken
5. Follow up as required
    `,
    contentType: 'text/markdown',
    size: 1350,
    uploadedBy: 'admin_002',
    uploadedAt: '2024-02-01T00:00:00.000Z',
    status: 'indexed',
    tags: ['case_management', 'best_practices', 'supervision', 'training'],
    metadata: {
      author: 'Training Division',
      audience: 'Probation Officers',
      trainingModule: 'CM-101',
    },
  },
  {
    id: 'doc_004',
    title: 'Legal References and Case Law',
    content: `
# Legal References and Case Law

## Constitutional Considerations
Probation supervision must balance public safety with constitutional rights:
- Fourth Amendment: Protection against unreasonable searches
- Due process requirements for violation proceedings
- Equal protection under the law

## Key Supreme Court Cases
### Griffin v. Wisconsin (1987)
- Established reasonable grounds standard for probationer searches
- Reduced expectation of privacy for probationers
- Warrantless searches permitted under certain conditions

### Gagnon v. Scarpelli (1973)
- Due process requirements for revocation proceedings
- Right to counsel in certain circumstances
- Preliminary and final hearing procedures

### Morrissey v. Brewer (1972)
- Fundamental due process protections
- Notice and hearing requirements
- Evidence standards for violations

## Illinois Specific Statutes
### 730 ILCS 5/5-6-3
Conditions of probation and supervision requirements

### 730 ILCS 5/5-6-4
Violation procedures and sanctions

### 730 ILCS 5/5-8A-3
Electronic monitoring provisions

## Recent Case Updates
Officers should stay current with legal developments:
- Subscribe to legal bulletins
- Attend training on new legislation
- Consult legal counsel when uncertain
- Document legal basis for all actions
    `,
    contentType: 'text/markdown',
    size: 1100,
    uploadedBy: 'legal_001',
    uploadedAt: '2024-02-15T00:00:00.000Z',
    status: 'indexed',
    tags: ['legal', 'case_law', 'constitutional', 'reference'],
    metadata: {
      author: 'Legal Department',
      jurisdiction: 'Illinois',
      lastReviewed: '2024-02-15',
    },
  },
  {
    id: 'doc_005',
    title: 'Mental Health Crisis Response Protocol',
    content: `
# Mental Health Crisis Response Protocol

## Recognition of Mental Health Crisis
Signs that may indicate a mental health emergency:
- Threats of self-harm or suicide
- Bizarre or delusional behavior
- Severe agitation or aggression
- Complete withdrawal or catatonia
- Substance-induced psychosis

## Immediate Response Steps
1. Ensure safety of all persons present
2. Remove weapons or dangerous objects
3. Call emergency services if immediate danger exists
4. Contact mental health crisis team
5. Notify supervisor and document incident

## De-escalation Techniques
- Speak calmly and slowly
- Use non-threatening body language
- Listen actively and show empathy
- Avoid arguing with delusions
- Provide reassurance when appropriate

## Coordination with Mental Health Services
### Crisis Teams
- 24/7 mobile crisis response available
- Trained mental health professionals
- Can provide on-scene assessment and intervention

### Hospitalization Procedures
When involuntary commitment may be necessary:
- Imminent danger to self or others
- Unable to provide for basic needs
- Follow state commitment procedures
- Coordinate with medical professionals

## Follow-up Requirements
After mental health crisis:
- Complete incident report within 24 hours
- Schedule follow-up assessment
- Review and modify supervision plan
- Consider additional mental health services
- Monitor for ongoing risk factors

## Resources and Contacts
- Crisis Hotline: 1-800-CRISIS-1
- Mobile Crisis Team: 555-HELP
- County Mental Health: 555-MH-DEPT
- Emergency Services: 911
    `,
    contentType: 'text/markdown',
    size: 1400,
    uploadedBy: 'health_001',
    uploadedAt: '2024-03-01T00:00:00.000Z',
    status: 'indexed',
    tags: ['mental_health', 'crisis', 'emergency', 'protocol'],
    metadata: {
      author: 'Mental Health Division',
      approvedBy: 'Clinical Director',
      effectiveDate: '2024-03-01',
    },
  },
];

export const knowledgeBaseDocuments = [
  {
    id: 'kb_001',
    type: 'regulation',
    title: 'Federal Probation Guidelines',
    content: 'Comprehensive federal guidelines for probation supervision...',
    category: 'supervision',
    jurisdiction: 'federal',
    authority: 'US Courts',
  },
  {
    id: 'kb_002',
    type: 'policy',
    title: 'Evidence-Based Supervision Practices',
    content: 'Research-backed approaches to effective probation supervision...',
    category: 'best_practices',
    jurisdiction: 'universal',
    authority: 'National Institute of Justice',
  },
];

export async function seedDocuments(): Promise<void> {
  console.log('Seeding document data...');
  console.log(`Created ${sampleDocuments.length} sample documents`);
  console.log(
    `Created ${knowledgeBaseDocuments.length} knowledge base documents`
  );
}
