import { StackProps } from "aws-cdk-lib";

export interface AdaptStackProps extends StackProps {
    stage: string;
}