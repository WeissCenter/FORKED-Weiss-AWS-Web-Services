![ADAPT Logo](/res/ADAPT_Logo.png "Accessible Data Analysis and Publishing Tool")

# Weiss AWS Web Services
The Rhonda Weiss Center for Accessible IDEA Data, or the Weiss Center, is a technical assistance data center under the Office of Special Education Programs at the U.S. Department of Education (Department).

Under the Individuals with Disabilities Education Act (IDEA), Sections 616 and 618, states are required to collect and analyze data on infants, toddlers, and children with disabilities and report on the data to the Department and the public. Currently, states struggle to report data in accessible formats that are also dynamic and usable by data consumers with disabilities or limited statistical knowledge. 

## Getting Started
These instructions will help you deploy the Weiss AWS Web Services to your AWS account. Before you begin, you will need administrator access to an AWS account.

### Prerequisites
Before you begin, perform the following steps.

1. Fork or clone this repository so you have a copy of the project on your local machine.
2. Ensure you have Node.js installed (version 18.x or later). You can download it from [nodejs.org](https://nodejs.org/).
3. Make sure you have npm (comes with Node.js) installed to manage dependencies.
4. Ensure you have the AWS CDK CLI installed. You can download it from [aws.amazon.com/cdk](https://aws.amazon.com/cdk/).
Verify the installation by checking the version:
```sh
cdk --version
```
5. Configure the AWS CDK CLI security credentials by following the instructions [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html).
6. Copy the sample workflow file in `/res/example-deploy.yml` to the `.github/workflows/` folder in your project and rename it if you wish.
7. Create AWS access keys to be used by the workflow in GitHub. See instructions [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey) to complete this step.
8. Generate a public and private VAPID key by running:
```sh
npx web-push generate-vapid-keys --json
```
9. Create repository secrets using the AWS credentials, and VAPID key you generated in the prior steps. These secrets must be named `AWS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `PUBLIC_VAPID_KEY`, and `PRIVATE_VAPID_KEY` exactly to work with the workflow. Instructions can be found [here](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

## Deployment
Commit and push all changes to the `main` branch of your GitHub repository. This will trigger the workflow to deploy the AWS resources.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer
This content was produced under U.S. Department of Education, Office of Special Education Programs, Award No. H373Q220002. Project Officer, Eric Caruso. The views expressed herein do not necessarily represent the positions or policies of the U.S. Department of Education. No official endorsement by the U.S. Department of Education of any product, commodity, service, or enterprise mentioned in this website is intended or should be inferred.

## Acknowledgments
ADAPT is developed by [AEM Corporation](https://www.aemcorp.com/) under the Weiss Center. 
