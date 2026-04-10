# Here is the rubric of how each model is evaluated. 
**Ensure that the pipelines match up with this**

Applying the Principles from the Textbook
Your pipelines will be evaluated on how well they apply the principles taught in Chapters 1–17. Specifically, we will be looking for evidence that you understand:
•          Pipeline thinking over algorithm-only thinking (Foreword, Ch. 1): Each pipeline should tell a complete story from business problem to deployed solution, not just demonstrate that you can run an algorithm.
•          The prediction vs. explanation distinction (Foreword, Ch. 9–11): For each pipeline, you must explicitly state whether your goal is prediction or explanation and make modeling choices that are consistent with that goal. If you are explaining, coefficients and interpretability matter more than predictive accuracy. If you are predicting, out-of-sample performance matters more than whether individual coefficients are interpretable. Do not treat accurate predictions as causal evidence, and do not produce interpretable analyses that cannot be operationalized.
•          Rigorous data preparation (Ch. 2–3, 7): Feature engineering, handling missing data, building reproducible pipelines. The quality of what goes into the model matters as much as the model itself.
•          Thoughtful exploration (Ch. 6, 8): Demonstrate that you actually looked at the data before modeling. Distributions, correlations, anomalies, and relationships should be documented and should inform your modeling choices.
•          Appropriate model selection (Ch. 12–14): Use the right tool for the job. Consider multiple approaches. If you use an ensemble (Ch. 14), explain why it is appropriate. If you use a decision tree (Ch. 12), explain what you gain in interpretability.
•          Evaluation discipline (Ch. 15): Proper validation, appropriate metrics, honest interpretation of results. Understand the real-world consequences of errors for this specific organization.
•          Feature selection with purpose (Ch. 16): Don’t throw everything in and hope for the best. Demonstrate that you thought about which features matter and why.
•          Deployment as a first-class concern (Ch. 17): A model that only exists in a notebook is not a pipeline. Move it into production.
A team that demonstrates mastery of these principles across multiple pipelines will outscore a team that produces many pipelines with shallow execution. Quality and quantity both matter, but quality comes first.
Rubric (20 points total)
Your score will be based on the number of complete, quality pipelines your team delivers. Each pipeline will be evaluated using the following criteria aligned with the full ML pipeline:
Pipeline Stage
What We’re Evaluating
Problem Framing
Is the business problem clearly stated? Does it matter to the organization? Is the choice of predictive vs. explanatory approach explicitly justified?
Data Acquisition, Preparation & Exploration
Is the data explored thoroughly? Are missing values, outliers, and feature engineering handled well? Is the data preparation reproducible as a pipeline? Are joins across tables done correctly and documented?
Modeling & Feature Selection
Is the model appropriate for the stated goal (prediction or explanation)? Are multiple approaches considered or compared? Is feature selection thoughtful and justified?
Evaluation & Selection
Are appropriate metrics used? Is the model validated properly (e.g., train/test split, cross-validation)? Are results interpreted in business terms, not just statistical terms?
Deployment & Integration
Is the model deployed and accessible? Is it integrated with the web application in a meaningful way? Does it provide value to end users?

