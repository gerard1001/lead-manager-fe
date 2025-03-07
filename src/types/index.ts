export type TLeadFormInputs = {
  name: string;
  email: string;
  status: ELeadStatus;
};

export type ILead = TLeadFormInputs & {
  _id: string;
};

export enum ELeadStatus {
  New = "New",
  Engaged = "Engaged",
  ProposalSent = "Proposal Sent",
  ClosedWon = "Closed-Won",
  ClosedLost = "Closed-Lost",
}
