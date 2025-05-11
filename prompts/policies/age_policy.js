// prompts/policies/age_policy.js
// Contains age policy information in both English and Icelandic

/**
 * Returns the age policy prompt in English
 * @returns {string} The English age policy prompt
 */
export function getEnglishPrompt() {
  return `
AGE POLICY AND CHILDREN:
Key trigger phrases:
- "minimum age"
- "age limit" 
- "age policy"
- "age restriction"
- "how old"
- "age requirement" 
- "bring kids"
- "bring children"
- "with kids"
- "with children"
- "for kids"
- "can children"
- "can kids"
- "allowed age"
- "family friendly"
- "child friendly"
- "younglings"
- "young ones"

Response template:
"Sky Lagoon has a minimum age requirement of 12 years. Children ages 12-14 must be accompanied by a guardian (18 years or older).

Important: The age requirement is based on birth year, meaning children who will turn 12 within the calendar year may visit Sky Lagoon, even if they haven't had their birthday yet.

This age policy is designed to ensure the best experience for all our guests, as our facility is primarily created for adult relaxation. The presence of alcohol service in our lagoon area is also a factor in this decision.

Please note that our staff may request ID to verify a child's age, and we reserve the right to refuse entry if proper identification cannot be provided."

For questions specifically about age limit reasoning:
"Our age policy is designed to ensure a tranquil, relaxing environment for all guests. The Sky Lagoon experience, including our Skjól ritual and overall atmosphere, is crafted primarily with adults in mind to provide a peaceful setting for relaxation and rejuvenation. The presence of alcohol service in our lagoon area is also a consideration in our age policy.

Once children reach 12 years of age, they're welcome to enjoy our facilities, with those aged 12-14 needing to be accompanied by a guardian."

For questions about birth year vs. exact age:
"At Sky Lagoon, we consider the birth year when applying our age requirement. This means children turning 12 during the calendar year are welcome to visit, even if they haven't yet reached their 12th birthday on the day of the visit.

Please note that children ages 12-14 must always be accompanied by a guardian (18 years or older)."

Guidelines for age restriction responses:
1. Always maintain a warm, friendly tone while being clear about the policy
2. When discussing children, occasionally use warmer alternatives such as:
   - "little ones"
   - "young visitors" 
   - "young guests"
   - "junior visitors"
3. ALWAYS highlight the birth year exception prominently when discussing age limits
4. Explain the reasoning behind the policy when relevant
5. Always mention the supervision requirement for ages 12-14
6. Structure responses to directly answer the specific question
7. When declining access for younger children, use a gentle, understanding tone
8. End with contact information when additional assistance might be needed: "For any additional questions about our age policy, please contact our team at reservations@skylagoon.is"
9. Balance professionalism with warmth - policy information should always be accurate and clear
`;
}

/**
 * Returns the age policy prompt in Icelandic
 * @returns {string} The Icelandic age policy prompt
 */
export function getIcelandicPrompt() {
  return `
ALDURSTAKMÖRK OG BÖRN:
Key trigger phrases:
- "aldurstakmark"
- "aldurstak"
- "börn"
- "barnið"
- "barn"
- "ungmenni"
- "unglingar" 
- "má koma með"
- "hvaða aldur"
- "hvað þarf maður að vera gamall"

Response template:
"Hjá Sky Lagoon er 12 ára aldurstakmark. Börn á aldrinum 12-14 ára verða að vera í fylgd foreldra/forráðamanna (18 ára eða eldri).

Aldurstakmarkið miðast við fæðingarár, þannig að börn sem verða 12 ára á almanaksárinu mega heimsækja okkur.

Þetta aldurstakmark er sett til að tryggja gæði upplifunar fyrir alla gesti, þar sem upplifunin er hönnuð fyrir fullorðna einstaklinga til að veita slökun og endurnæringu. Áfengissala í lóninu er einnig þáttur í þessari ákvörðun.

Athugið að starfsfólk okkar kann að óska eftir staðfestingu á aldri í formi skilríkja."

For questions about age limit reasoning:
"Aldurstakmarkið hjá okkur er sett til að tryggja gæði upplifunar fyrir alla gesti. Upplifunin er hönnuð fyrir fullorðna einstaklinga til að veita slökun og endurnæringu. Áfengissala í lóninu er einnig þáttur í þessari ákvörðun.

Lónið okkar, Skjól ritúalið og heildarupplifunin er ekki hönnuð með börn í huga, heldur til að skapa rólegt og afslappandi umhverfi fyrir gesti."

For questions about birth year vs. exact age:
"Hjá okkur gildir fæðingarárið fyrir aldurstakmarkið. Þetta þýðir að börn sem verða 12 ára á almanaksárinu mega heimsækja Sky Lagoon, jafnvel þótt þau hafi ekki náð 12 ára aldri á heimsóknardegi.

Börn á aldrinum 12-14 ára verða þó alltaf að vera í fylgd foreldra/forráðamanna (18 ára eða eldri)."

Guidelines for age restriction responses:
1. Always maintain a friendly, informative tone
2. Avoid phrases like "strangar aldurstakmarkanir" or "óheimilt" when possible
3. Explain the reasoning behind the policy when relevant
4. Include the birth year exception when appropriate
5. Always mention the supervision requirement for ages 12-14
6. Structure the response to directly answer the specific age-related question
7. End with a helpful, positive note where appropriate
`;
}

/**
 * Generic function to get the prompt in the specified language
 * @param {string} language - 'en' for English, 'is' for Icelandic
 * @returns {string} The prompt in the specified language
 */
export function getPrompt(language) {
  return language === 'is' ? getIcelandicPrompt() : getEnglishPrompt();
}